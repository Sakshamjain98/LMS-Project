// scripts/createAdmin.js
import mongoose from 'mongoose';
import userModel from '../src/models/user.model.js';
import { hashPassword } from '../src/shared/utils/bcrypt.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'admin@example.com';
    const existing = await userModel.findOne({ email });
    if (existing) {
      console.log('Admin already exists');
      process.exit();
    }
    const hashed = await hashPassword('Admin@123');
    const admin = await userModel.create({
      name: 'Super Admin',
      email,
      password: hashed,
      role: 'admin',
      isApproved: true,
    });
    console.log('Admin created:', admin.email);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

createAdmin();