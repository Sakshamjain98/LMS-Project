import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uriArg = process.argv[2];
const uri = uriArg || process.env.MONGO_URI;

if (!uri) {
  console.error('No MONGO_URI provided. Pass as argument or set in .env');
  process.exit(1);
}

const run = async () => {
  try {
    console.log('Connecting to', uri.replace(/:\/\/.*@/, '://<REDACTED>@'));
    await mongoose.connect(uri, { maxPoolSize: 5 });
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    const usersColl = db.collection('users');
    const exists = collections.some(c => c.name === 'users');
    if (!exists) {
      console.log('No users collection found. count = 0');
    } else {
      const count = await usersColl.countDocuments();
      console.log('Users count:', count);
      if (count > 0) {
        const sample = await usersColl.find({}).limit(3).project({ email: 1, name: 1, role: 1 }).toArray();
        console.log('Sample users:', sample);
      }
    }
  } catch (err) {
    console.error('Error connecting or querying:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
