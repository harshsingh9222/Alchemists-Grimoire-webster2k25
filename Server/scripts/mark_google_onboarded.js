#!/usr/bin/env node
// Load environment variables from Server/.env if present
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
import mongoose from 'mongoose';
import { connectDB } from '../src/DB/connectDB.js';
import User from '../src/Models/user.models.js';

const run = async () => {
  // Allow overriding connection via CLI args: --uri <mongodb_uri> and --db <db_name>
  const argv = process.argv.slice(2);
  const getArg = (name) => {
    const idx = argv.findIndex(a => a === name);
    if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1];
    const match = argv.find(a => a.startsWith(name + '='));
    if (match) return match.split('=')[1];
    return null;
  };

  const cliUri = getArg('--uri') || getArg('--uri=' + '')
  const cliDb = getArg('--db') || getArg('--db=' + '')
  if (cliUri) process.env.MONGODB_URI = cliUri;
  if (cliDb) process.env.DB_NAME = cliDb;

  try {
    // connect using project's connectDB which reads process.env.MONGODB_URI and DB_NAME
    await connectDB();

  console.log('Updating Google users to set onboarded: true and emailConfirmed: true...');
  // Update users that either are not onboarded or not emailConfirmed
  const filter = { provider: 'google', $or: [ { onboarded: { $ne: true } }, { emailConfirmed: { $ne: true } } ] };
  const update = { $set: { onboarded: true, emailConfirmed: true } };
  const result = await User.updateMany(filter, update);

  // Note: depending on Mongoose version, result may expose different fields; handle both common shapes
  const matched = result.matchedCount ?? result.n ?? 0;
  const modified = result.modifiedCount ?? result.nModified ?? 0;
  console.log(`Matched: ${matched}, Modified: ${modified}`);
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
