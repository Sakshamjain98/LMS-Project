import mongoose from "mongoose";

const teacherVisibilitySchema = new mongoose.Schema(
  {
    notesEnabled: { type: Boolean, default: false },
    uploadEnabled: { type: Boolean, default: false },
    testsEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const teacherDashboardStatsSchema = new mongoose.Schema(
  {
    totalCourses: { type: Boolean, default: false },
    pendingApproval: { type: Boolean, default: false },
    publishedCourses: { type: Boolean, default: false },
    totalNotes: { type: Boolean, default: false },
    totalTests: { type: Boolean, default: true },
    draftTests: { type: Boolean, default: true },
    publishedTests: { type: Boolean, default: true },
    quickActions: { type: Boolean, default: true },
  },
  { _id: false }
);

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "singleton",
      unique: true,
      immutable: true,
    },
    teacherVisibility: {
      type: teacherVisibilitySchema,
      default: () => ({}),
    },
    teacherDashboardStats: {
      type: teacherDashboardStatsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export const DEFAULT_TEACHER_SETTINGS = {
  teacherVisibility: {
    notesEnabled: false,
    uploadEnabled: false,
    testsEnabled: true,
  },
  teacherDashboardStats: {
    totalCourses: false,
    pendingApproval: false,
    publishedCourses: false,
    totalNotes: false,
    totalTests: true,
    draftTests: true,
    publishedTests: true,
    quickActions: true,
  },
};

export default mongoose.model("PlatformSettings", platformSettingsSchema);
