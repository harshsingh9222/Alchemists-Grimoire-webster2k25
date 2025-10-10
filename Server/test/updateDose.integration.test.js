import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bodyParser from 'body-parser';
import supertest from 'supertest';

import doseRouter from '../src/Routes/dose.Route.js';
import User from '../src/Models/user.models.js';
import Medicine from '../src/Models/medicineModel.js';
import DoseLog from '../src/Models/doseLogModel.js';

let mongod;
let app;
let request;
let serverUser;

describe('POST /doses/update integration', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // create a test user
  serverUser = await User.create({ username: 'testuser', email: 'test@example.com', password: 'secret' });

    // create a medicine for the user
  const med = await Medicine.create({ userId: serverUser._id, medicineName: 'TestMed', times: ['09:00'], startDate: new Date(), frequency: 'daily', dosage: '1 pill', timezone: 'UTC' });

  // create an express app and mount the dose update handler directly to avoid the verifyJWT middleware
  app = express();
  app.use(bodyParser.json());
  // import the controller function directly
  const { updateDoseStatus } = await import('../src/Controllers/dose.Controller.js');
  const testRouter = express.Router();
  // fake auth middleware for router
  testRouter.use((req, res, next) => { req.user = serverUser; next(); });
  testRouter.post('/update', updateDoseStatus);
  app.use('/doses', testRouter);

    request = supertest(app);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('should create a dose log when taking within allowed window', async () => {
    const scheduled = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
    const med = await Medicine.findOne({ userId: serverUser._id });

    const res = await request.post('/doses/update').send({ medicineId: med._id, scheduledTime: scheduled, status: 'taken' });

    expect(res.status).toBe(200);
    expect(res.body?.data?._id).toBeTruthy();

    // ensure dose log exists
    const log = await DoseLog.findOne({ userId: serverUser._id, medicineId: med._id });
    expect(log).toBeTruthy();
    expect(log.status).toBe('taken');
  });

  it('should reject taking too early (403)', async () => {
    const scheduled = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes from now
    const med = await Medicine.findOne({ userId: serverUser._id });

    const res = await request.post('/doses/update').send({ medicineId: med._id, scheduledTime: scheduled, status: 'taken' });

    expect(res.status).toBe(403);
  });
});
