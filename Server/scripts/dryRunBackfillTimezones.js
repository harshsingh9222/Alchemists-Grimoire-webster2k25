#!/usr/bin/env node
/**
 * Dry-run backfill: For medicines missing timezone, compute what future dose logs
 * would be created if we assigned a timezone (per-user timezone or fallback).
 *
 * Usage: node scripts/dryRunBackfillTimezones.js [--apply] [--days=30]
 * Default: dry-run (no writes), days=30
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Medicine from '../src/Models/medicineModel.js';
import User from '../src/Models/user.models.js';
import { DateTime } from 'luxon';

function localTimeToUTCDate(date, timeHHMM, timezone) {
  const dt = DateTime.fromISO((new Date(date)).toISOString(), { zone: 'utc' });
  const parts = DateTime.fromObject(
    { year: dt.year, month: dt.month, day: dt.day },
    { zone: timezone }
  );
  const [hourStr, minStr] = timeHHMM.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);
  const local = DateTime.fromObject(
    { year: parts.year, month: parts.month, day: parts.day, hour, minute },
    { zone: timezone }
  );
  return new Date(local.toUTC().toISO());
}

dotenv.config();

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const recreate = args.includes('--recreate');
const daysArg = args.find(a => a.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;
const idsArg = args.find(a => a.startsWith('--medicineIds='));
const medicineIds = idsArg ? idsArg.split('=')[1].split(',').map(s => s.trim()) : null;
import fs from 'fs';
import path from 'path';
import DoseLog from '../src/Models/doseLogModel.js';
import { createDoseLogsForMedicine } from '../src/Utils/doseLogCreater.js';

async function ensureConnected() {
  if (process.env.MONGODB_URI) {
    const uri = `${process.env.MONGODB_URI}`;
    console.log('Connecting to MongoDB URI from env...');
    await mongoose.connect(uri);
    return { usingMemory: false };
  }

  console.log('No MONGODB_URI set; spinning up an in-memory MongoDB for dry-run...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return { usingMemory: true, mongod };
}

function shouldCreateLog(medicine, date) {
  if (!medicine) return false;
  if (medicine.frequency === 'daily') return true;
  if (medicine.frequency === 'weekly') {
    if (Array.isArray(medicine.days) && medicine.days.length > 0) {
      const checkDay = date.getDay();
      return medicine.days.includes(checkDay);
    }
    const startDay = new Date(medicine.startDate).getDay();
    return startDay === date.getDay();
  }
  if (medicine.frequency === 'as-needed') return false;
  return true;
}

async function computeFutureLogs(medicine, fromDate, ndays) {
  const results = [];
  const start = new Date(fromDate);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(end.getDate() + ndays);

  for (let d = new Date(Math.max(start, new Date(medicine.startDate || start))); d <= end; d.setDate(d.getDate() + 1)) {
    if (!shouldCreateLog(medicine, d)) continue;
    for (const timeStr of medicine.times || []) {
      const [hourStr, minStr] = timeStr.split(':');
      const h = parseInt(hourStr, 10);
      const m = parseInt(minStr, 10);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;
      let scheduled;
      if (medicine.timezone) {
        scheduled = localTimeToUTCDate(d, timeStr, medicine.timezone);
      } else {
        const sd = new Date(d);
        sd.setHours(h, m, 0, 0);
        scheduled = sd;
      }
      if (scheduled > new Date()) {
        results.push({ date: new Date(d), time: timeStr, scheduled: scheduled.toISOString() });
      }
    }
  }
  return results;
}

async function run() {
  const connInfo = await ensureConnected();

  try {
    const medicines = await Medicine.find({ timezone: { $in: [null, ''] } }).limit(500);
    console.log(`Found ${medicines.length} medicines with no timezone (sample limit 500).`);

    const report = [];

    // filter by provided medicineIds if present (pilot)
    const selected = medicineIds ? medicines.filter(m => medicineIds.includes(String(m._id))) : medicines;

    // If applying and using a specific pilot set, create a consolidated backup of medicines + all DoseLogs before any writes
    if (apply && medicineIds && medicineIds.length > 0) {
      const fullBackup = [];
      for (const mid of medicineIds) {
        const medDoc = await Medicine.findById(mid).lean();
        if (!medDoc) continue;
        const allLogs = await DoseLog.find({ medicineId: mid }).lean();
        fullBackup.push({ medicine: medDoc, doseLogs: allLogs });
      }
      const pilotBackupFile = path.join(process.cwd(), 'scripts', 'backups', `pilot-full-backup-${Date.now()}.json`);
      fs.writeFileSync(pilotBackupFile, JSON.stringify(fullBackup, null, 2));
      console.log(`Wrote consolidated pilot backup to ${pilotBackupFile} (medicines + all DoseLogs)`);
    }

    for (const med of selected) {
      let userTz = null;
      try {
        const user = await User.findById(med.userId);
        userTz = user?.timezone || null;
      } catch (e) {
        userTz = null;
      }

      const assignedTz = userTz || 'UTC';
      const future = await computeFutureLogs(med, new Date(), days);

      report.push({ medicineId: med._id.toString(), medicineName: med.medicineName, assignedTz, futureCount: future.length, sample: future.slice(0,3) });

      if (apply) {
        console.log(`Applying timezone ${assignedTz} to medicine ${med._id} (apply mode).`);
        await Medicine.updateOne({ _id: med._id }, { $set: { timezone: assignedTz } });

        if (recreate) {
          // Backup future pending DoseLogs to a local JSON before deletion
          const now = new Date();
          const futureLogs = await DoseLog.find({ medicineId: med._id, status: 'pending', scheduledTime: { $gte: now } }).lean();
          const backupDir = path.join(process.cwd(), 'scripts', 'backups');
          if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
          const backupFile = path.join(backupDir, `doseLogs-backup-${med._id}-${Date.now()}.json`);
          fs.writeFileSync(backupFile, JSON.stringify(futureLogs, null, 2));
          console.log(`Backed up ${futureLogs.length} future DoseLogs to ${backupFile}`);

          // Delete future pending DoseLogs
          const delRes = await DoseLog.deleteMany({ medicineId: med._id, status: 'pending', scheduledTime: { $gte: now } });
          console.log(`Deleted ${delRes.deletedCount} future pending DoseLogs for medicine ${med._id}`);

          // Recreate dose logs using existing helper
          await createDoseLogsForMedicine(med, med.userId);
          console.log(`Recreated future DoseLogs for medicine ${med._id}`);
        } else {
          console.log(`Timezone assigned but recreation not requested for ${med._id}.`);
        }
      }
    }

    // Print summary
    console.log('\n=== Dry-run Backfill Report ===');
    console.log(`Medicines evaluated: ${report.length}`);
    const totalFuture = report.reduce((s, r) => s + r.futureCount, 0);
    console.log(`Total future dose logs (next ${days} days): ${totalFuture}`);
    console.log('\nSample per-medicine:');
    report.slice(0, 50).forEach(r => {
      console.log(`- ${r.medicineName} (${r.medicineId}): assignTZ=${r.assignedTz} future=${r.futureCount} sample=${JSON.stringify(r.sample)}`);
    });

    if (!apply) {
      console.log('\nNo DB writes were performed (dry-run). To apply changes, re-run with --apply flag.');
    } else {
      console.log('\nApply mode performed updates to Medicine.timezone (future dose logs still need recreation via createDoseLogsForMedicine).');
    }

    if (connInfo?.usingMemory && connInfo.mongod) {
      await connInfo.mongod.stop();
    }
  } catch (err) {
    console.error('Error during dry-run backfill:', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
  }
}

run();
