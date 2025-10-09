import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Medicine from '../src/Models/medicineModel.js';
import DoseLog from '../src/Models/doseLogModel.js';
import { createDoseLogsForMedicine } from '../src/Utils/doseLogCreater.js';
import { localTimeToUTCDate } from '../src/Utils/timezone.helper.js';

let mongod;

describe('DST and timezone edge cases for dose log creation', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('creates scheduledTime for Asia/Kolkata (no DST) correctly', async () => {
    const med = await Medicine.create({
      userId: new mongoose.Types.ObjectId(),
      medicineName: 'KolkataMed',
      times: ['08:30'],
      startDate: new Date('2025-10-10'),
      frequency: 'daily',
      dosage: '1',
      timezone: 'Asia/Kolkata'
    });

    await createDoseLogsForMedicine(med, med.userId);

    const log = await DoseLog.findOne({ medicineId: med._id });
    expect(log).toBeTruthy();

    const expected = localTimeToUTCDate(new Date('2025-10-10'), '08:30', 'Asia/Kolkata');
    expect(log.scheduledTime.toISOString()).toBe(new Date(expected).toISOString());
  });

  it('creates scheduledTime for America/New_York around DST end consistently', async () => {
    const med = await Medicine.create({
      userId: new mongoose.Types.ObjectId(),
      medicineName: 'NYMed',
      times: ['01:30'],
      startDate: new Date('2025-11-02'),
      frequency: 'daily',
      dosage: '1',
      timezone: 'America/New_York'
    });

    await createDoseLogsForMedicine(med, med.userId);

    const log = await DoseLog.findOne({ medicineId: med._id });
    expect(log).toBeTruthy();

    const expected = localTimeToUTCDate(new Date('2025-11-02'), '01:30', 'America/New_York');
    expect(log.scheduledTime.toISOString()).toBe(new Date(expected).toISOString());
  });
});
