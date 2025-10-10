// ========================================
// server/schedulers/doseScheduler.js
// ========================================
import cron from 'node-cron';
import Medicine from '../Models/medicineModel.js';
import DoseLog from '../Models/doseLogModel.js';
import WellnessScore from '../Models/wellnessScoreModel.js';
import Notification from '../Models/notificationModel.js';
import User from '../Models/user.models.js';
import nodemailer from 'nodemailer';
import { localTimeToUTCDate } from '../Utils/timezone.helper.js';

class DoseScheduler {
  constructor() {
    this.jobs = new Map();
  }

  // Initialize the scheduler
  init() {
    console.log('🎪 Initializing Alchemist Dose Scheduler...');
    
    // Run every hour to create dose logs for the next hour
    cron.schedule('0 * * * *', () => {
      this.createUpcomingDoseLogs();
    });
    
    // Run a lightweight missed-dose scan every 2 minutes to
    // detect doses that passed their 30-minute grace period promptly.
    // Using a short, idempotent job is safe because the handler only acts on
    // DoseLogs still marked 'pending' and older than 30 minutes.
    cron.schedule('*/2 * * * *', () => {
      this.checkMissedDoses();
    });
    
    // Update wellness scores daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.updateDailyWellnessScores();
    });
    
    // Send reminder notifications (every 15 minutes)
    // Running every 15 minutes is fine as long as the reminder window
    // (windowMs + 2 * toleranceMs) is larger than the scheduling interval.
    cron.schedule('*/2 * * * *', () => {
      this.sendDoseReminders();
    });
    // Run a one-time backfill for missed doses before today (non-blocking)
    (async () => {
      try {
        const today = new Date();
        today.setHours(0,0,0,0);
        console.log('🔁 Running one-time backfill for missed doses before', today.toISOString());
        await this.backfillMissedDosesBefore(today);
        console.log('✅ Backfill completed');
      } catch (err) {
        console.error('Backfill error:', err);
      }
    })();

    console.log('✨ Dose Scheduler initialized successfully!');
  }

  // Create dose logs for upcoming doses
  async createUpcomingDoseLogs() {
    try {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Get all active medicines
      const medicines = await Medicine.find({
        $or: [
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }).populate('userId');
      
      for (const medicine of medicines) {
        // Check if medicine is active for today
        if (medicine.frequency === 'daily' || 
            (medicine.frequency === 'weekly' && this.isScheduledToday(medicine))) {
          
          for (const timeStr of medicine.times) {
            let scheduledTime;
            if (medicine.timezone) {
              // compute scheduled instant for today's date in medicine.timezone
              scheduledTime = localTimeToUTCDate(new Date(), timeStr, medicine.timezone);
            } else {
              const [hours, minutes] = timeStr.split(':').map(Number);
              scheduledTime = new Date();
              scheduledTime.setHours(hours, minutes, 0, 0);
            }
            
            // Only create logs for upcoming doses in the next hour
            if (scheduledTime > now && scheduledTime <= nextHour) {
              // Check if log already exists
              const sStart = new Date(scheduledTime);
              sStart.setSeconds(0, 0);
              const sEnd = new Date(scheduledTime);
              sEnd.setSeconds(59, 999);

              const existingLog = await DoseLog.findOne({
                userId: medicine.userId,
                medicineId: medicine._id,
                scheduledTime: {
                  $gte: sStart,
                  $lt: sEnd
                }
              });
              
              if (!existingLog) {
                await DoseLog.create({
                  userId: medicine.userId,
                  medicineId: medicine._id,
                  scheduledTime,
                  status: 'pending',
                  dayOfWeek: scheduledTime.getDay(),
                  hour: scheduledTime.getHours()
                });
                
                console.log(`📝 Created dose log for ${medicine.medicineName} at ${timeStr}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error creating dose logs:', error);
    }
  }

  // Check for missed doses and update their status
  async checkMissedDoses() {
    try {
      const now = new Date();
      // Use a 30 minute buffer with a small tolerance to avoid exact matches
      const bufferMs = 30 * 60 * 1000;

      // Calculate cutoff (now - bufferMs) and fetch only doses that are at least bufferMs late
      const cutoff = new Date(now.getTime() - bufferMs);
      const missedDoses = await DoseLog.find({
        status: 'pending',
        scheduledTime: { $lte: cutoff }
      }).populate('medicineId userId');

      // Create transporter if email creds provided
      let transporter = null;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      }
      
      for (const dose of missedDoses) {
        // Process even if a reminder was previously sent; rely on Notification
        // existence check to avoid duplicate missed notifications.

        dose.status = 'missed';
        dose.notificationSent = true;
        await dose.save();

  // Only create a missed notification if none exists
        const exists = await Notification.findOne({ relatedDoseLogId: dose._id, type: 'missed_dose' });
        if (!exists) {
          const note = await Notification.create({
            userId: dose.userId._id,
            medicineId: dose.medicineId._id,
            type: 'missed_dose',
            title: 'Missed Dose Alert',
            message: `You missed your ${dose.medicineId.medicineName} dose scheduled for ${dose.scheduledTime.toLocaleTimeString()}`,
            priority: 'high',
            actionRequired: true,
            actionType: 'confirm_taken',
            relatedDoseLogId: dose._id,
            scheduledFor: dose.scheduledTime,
            sentAt: new Date()
          });

            // send email only for Google-authenticated users
            try {
              const user = dose.userId || (await User.findById(dose.userId));
              const toEmail = user?.email;
              const isGoogleUser = (user?.provider === 'google') || Boolean(user?.google?.refreshToken);

              if (!isGoogleUser) {
                console.log(`Skipping missed-dose email for non-Google user ${user?.email || user?._id}`);
              } else if (!transporter) {
                console.log('Email transporter not configured; skipping missed-dose email send');
              } else if (toEmail) {
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: toEmail,
                  subject: note.title,
                  html: `<p>${note.message}</p>`
                });
              }
            } catch (mailErr) {
              console.warn('Failed to send missed-dose email:', mailErr?.message || mailErr);
            }
        } else {
          // missed notification already exists; optionally prevent re-sending email
          // no-op
        }

        console.log(`⚠️ Marked dose as missed and notified: ${dose.medicineId.medicineName}`);
      }
    } catch (error) {
      console.error('Error checking missed doses:', error);
    }
  }

  // Backfill missed doses scheduled before a given date (process in batches)
  async backfillMissedDosesBefore(date, batchSize = 200) {
    try {
      const cutoff = new Date(date);
      // We'll process in batches to avoid large memory/IO spikes
      let page = 0;
      while (true) {
        const meds = await DoseLog.find({ status: 'pending', scheduledTime: { $lt: cutoff } })
          .sort({ scheduledTime: 1 })
          .skip(page * batchSize)
          .limit(batchSize)
          .populate('medicineId userId');

        if (!meds || meds.length === 0) break;

        // prepare transporter once per batch
        let transporter = null;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
        }

        for (const dose of meds) {
          try {
            if (dose.notificationSent) continue;

            // create notification if missing
            const exists = await Notification.findOne({ relatedDoseLogId: dose._id, type: 'missed_dose' });
            if (!exists) {
              const note = await Notification.create({
                userId: dose.userId._id,
                medicineId: dose.medicineId._id,
                type: 'missed_dose',
                title: 'Missed Dose (Backfill)',
                message: `You missed your ${dose.medicineId.medicineName} dose scheduled for ${dose.scheduledTime.toLocaleString()}`,
                priority: 'high',
                actionRequired: true,
                actionType: 'confirm_taken',
                relatedDoseLogId: dose._id,
                scheduledFor: dose.scheduledTime,
                sentAt: new Date()
              });

              // send email only for Google-authenticated users
              try {
                const user = dose.userId || (await User.findById(dose.userId));
                const toEmail = user?.email;
                const isGoogleUser = (user?.provider === 'google') || Boolean(user?.google?.refreshToken);

                if (!isGoogleUser) {
                  console.log(`Skipping backfill email for non-Google user ${user?.email || user?._id}`);
                } else if (!transporter) {
                  console.log('Email transporter not configured; skipping backfill email send');
                } else if (toEmail) {
                  await transporter.sendMail({ from: process.env.EMAIL_USER, to: toEmail, subject: note.title, html: `<p>${note.message}</p>` });
                }
              } catch (mailErr) {
                console.warn('Backfill email send failed for dose', dose._id, mailErr?.message || mailErr);
              }
            }

            // mark as missed and notificationSent
            dose.status = 'missed';
            dose.notificationSent = true;
            await dose.save();
          } catch (innerErr) {
            console.error('Error processing backfill dose', dose._id, innerErr);
          }
        }

        // next page
        page += 1;
      }
    } catch (err) {
      console.error('backfillMissedDosesBefore error:', err);
      throw err;
    }
  }

  // Send dose reminders
  async sendDoseReminders() {
    try {
      const now = new Date();
      // We'll consider upcoming doses within ~30 minutes (with tolerance)
      const windowMs = 30 * 60 * 1000;
  // Increase tolerance so the reminder window safely overlaps
  // between 15-minute runs. A 15 minute tolerance expands the
  // query window on both sides by 15 minutes.
  const toleranceMs = 15 * 60 * 1000; // 15 min tolerance
      const windowStart = new Date(now.getTime() - toleranceMs);
      const windowEnd = new Date(now.getTime() + windowMs + toleranceMs);

      // Find upcoming doses in the window that haven't had notifications
      const upcomingDoses = await DoseLog.find({
        status: 'pending',
        notificationSent: false,
        scheduledTime: { $gte: windowStart, $lte: windowEnd }
      }).populate('medicineId userId');

      // prepare transporter if email creds provided
      let transporter = null;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      }

      for (const dose of upcomingDoses) {
        // Avoid duplicates (also check Notification collection)
        const exists = await Notification.findOne({ relatedDoseLogId: dose._id, type: 'dose_reminder' });
        if (exists) {
          dose.reminderSent = true;
          dose.notificationSent = true;
          await dose.save();
          continue;
        }
        const note = await Notification.create({
          userId: dose.userId._id,
          medicineId: dose.medicineId._id,
          type: 'dose_reminder',
          title: '⏰ Upcoming dose reminder',
          message: `Reminder: Upcoming dose of ${dose.medicineId.medicineName} scheduled at ${dose.scheduledTime.toLocaleTimeString()}`,
          priority: 'medium',
          actionRequired: false,
          actionType: 'take_dose',
          relatedDoseLogId: dose._id,
          scheduledFor: dose.scheduledTime,
          sentAt: new Date()
        });

        // send email only for Google-authenticated users (avoid stuck or fake emails)
        try {
          const user = dose.userId || (await User.findById(dose.userId));
          const toEmail = user?.email;
          const isGoogleUser = (user?.provider === 'google') || Boolean(user?.google?.refreshToken);

          if (!isGoogleUser) {
            console.log(`Skipping email for non-Google user ${user?.email || user?._id}`);
          } else if (!transporter) {
            console.log('Email transporter not configured; skipping email send');
          } else if (toEmail) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: toEmail,
              subject: note.title,
              html: `<p>${note.message}</p>`
            });
          }
        } catch (mailErr) {
          console.warn('Failed to send reminder email:', mailErr?.message || mailErr);
        }

        dose.reminderSent = true;
        dose.notificationSent = true;
        await dose.save();

        console.log(`🔔 Sent upcoming reminder for ${dose.medicineId.medicineName}`);
      }
    } catch (error) {
      console.error('Error sending dose reminders:', error);
    }
  }

  // Update daily wellness scores
  async updateDailyWellnessScores() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all users with medicines
      const users = await Medicine.distinct('userId');
      
      for (const userId of users) {
        // Calculate yesterday's adherence
        const adherenceRate = await DoseLog.calculateAdherence(
          userId,
          yesterday,
          today
        );
        
        // Get previous wellness score to calculate trends
        const previousScore = await WellnessScore.findOne({
          userId,
          date: { $lt: yesterday }
        }).sort({ date: -1 });
        
        // Calculate new metrics based on adherence and trends
        let metrics = {
          energy: 70,
          focus: 70,
          mood: 70,
          sleep: 70,
          vitality: 70,
          balance: 70
        };
        
        // Adjust metrics based on adherence
        if (adherenceRate >= 90) {
          metrics.energy += 20;
          metrics.focus += 15;
          metrics.mood += 20;
          metrics.vitality += 15;
        } else if (adherenceRate >= 70) {
          metrics.energy += 10;
          metrics.focus += 10;
          metrics.mood += 10;
          metrics.vitality += 10;
        } else if (adherenceRate < 50) {
          metrics.energy -= 10;
          metrics.focus -= 15;
          metrics.mood -= 10;
          metrics.vitality -= 10;
        }
        
        // Ensure metrics stay within bounds
        Object.keys(metrics).forEach(key => {
          metrics[key] = Math.max(0, Math.min(100, metrics[key]));
        });
        
        // Determine factors
        const factors = [];
        if (adherenceRate >= 90) factors.push('all_doses_taken');
        if (adherenceRate < 50) factors.push('missed_doses');
        
        // Create wellness score for yesterday
        await WellnessScore.create({
          userId,
          date: yesterday,
          metrics,
          adherenceRate,
          factors
        });
        
        console.log(`📊 Updated wellness score for user ${userId}`);
      }
    } catch (error) {
      console.error('Error updating wellness scores:', error);
    }
  }

  // Helper function to check if weekly medicine is scheduled for today
  isScheduledToday(medicine) {
    // This is a simplified version - you might want to add more complex logic
    const today = new Date().getDay();
    // For now, assume weekly medicines are taken on the start date's day of week
    const startDay = new Date(medicine.startDate).getDay();
    return today === startDay;
  }

  // Stop all scheduled jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('🛑 Dose Scheduler stopped');
  }
}

export default new DoseScheduler();