import mongoose from "mongoose";

const adminAnalyticsSchema = new mongoose.Schema(
  {
    totalUsers: Number,
    totalStudents: Number,
    totalTeachers: Number,
    totalRevenue: Number,
    totalCourses: Number,
    totalTests: Number,
    activeSubscriptions: Number,
  },
  { timestamps: true }
);

export default mongoose.model("AdminAnalytics", adminAnalyticsSchema);
