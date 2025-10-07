// ========================================
// server/schedulers/doseScheduler.js
// ========================================
import cron from 'node-cron';
import Medicine from '../Models/medicineModel.js';
import DoseLog from '../Models/doseLogModel.js';
import WellnessScore from '../Models/wellnessScoreModel.js';
import Notification from '../Models/notificationModel.js';

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
    
    // Check for missed doses every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.checkMissedDoses();
    });
    
    // Update wellness scores daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.updateDailyWellnessScores();
    });
    
    // Send reminder notifications
    cron.schedule('*/5 * * * *', () => {
      this.sendDoseReminders();
    });
    
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
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);
            
            // Only create logs for upcoming doses in the next hour
            if (scheduledTime > now && scheduledTime <= nextHour) {
              // Check if log already exists
              const existingLog = await DoseLog.findOne({
                userId: medicine.userId,
                medicineId: medicine._id,
                scheduledTime: {
                  $gte: new Date(scheduledTime).setSeconds(0, 0),
                  $lt: new Date(scheduledTime).setSeconds(59, 999)
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
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      // Find pending doses that are past their scheduled time
      const missedDoses = await DoseLog.find({
        status: 'pending',
        scheduledTime: { $lt: thirtyMinutesAgo }
      }).populate('medicineId userId');
      
      for (const dose of missedDoses) {
        dose.status = 'missed';
        await dose.save();
        
        // Create a notification for missed dose
        await Notification.create({
          userId: dose.userId._id,
          medicineId: dose.medicineId._id,
          type: 'missed_dose',
          title: 'Missed Dose Alert',
          message: `You missed your ${dose.medicineId.medicineName} dose scheduled for ${dose.scheduledTime.toLocaleTimeString()}`,
          priority: 'high',
          actionRequired: true,
          actionType: 'confirm_taken',
          relatedDoseLogId: dose._id,
          scheduledFor: now
        });
        
        console.log(`⚠️ Marked dose as missed: ${dose.medicineId.medicineName}`);
      }
    } catch (error) {
      console.error('Error checking missed doses:', error);
    }
  }

  // Send dose reminders
  async sendDoseReminders() {
    try {
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
      
      // Find upcoming doses in the next 15 minutes
      const upcomingDoses = await DoseLog.find({
        status: 'pending',
        reminderSent: false,
        scheduledTime: {
          $gte: now,
          $lte: in15Minutes
        }
      }).populate('medicineId userId');
      
      for (const dose of upcomingDoses) {
        // Create reminder notification
        await Notification.create({
          userId: dose.userId._id,
          medicineId: dose.medicineId._id,
          type: 'dose_reminder',
          title: '⏰ Time for your potion!',
          message: `It's time to take ${dose.medicineId.medicineName} (${dose.medicineId.dosage})`,
          priority: 'high',
          actionRequired: true,
          actionType: 'take_dose',
          relatedDoseLogId: dose._id,
          scheduledFor: dose.scheduledTime
        });
        
        // Mark reminder as sent
        dose.reminderSent = true;
        await dose.save();
        
        console.log(`🔔 Sent reminder for ${dose.medicineId.medicineName}`);
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