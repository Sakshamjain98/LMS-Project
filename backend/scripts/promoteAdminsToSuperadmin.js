// One-time migration: run BEFORE deploying the requirePermission-gated admin
// routes. Existing role:"admin" users currently have unrestricted access;
// this promotes them to role:"superadmin" so nobody is locked out once
// granular per-admin permissions ship.
//
// Usage: node backend/scripts/promoteAdminsToSuperadmin.js
import mongoose from 'mongoose';
import userModel from '../src/models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await userModel.updateMany(
      { role: 'admin' },
      { $set: { role: 'superadmin', permissions: [], isActive: true } }
    );
    console.log(`Promoted ${result.modifiedCount} existing admin(s) to superadmin.`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

run();
