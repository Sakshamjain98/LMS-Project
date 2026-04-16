import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 5000),
      maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || 20),
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
export default connectDB;
