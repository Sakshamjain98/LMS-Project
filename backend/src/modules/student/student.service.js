import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";
import Subscription from "../../models/subscription.model.js";
import Payment from "../../models/payment.model.js";
import Note from "../../models/note.model.js";

export const getDashboardData = async () => {
  const [freeCourses, blogs] = await Promise.all([
    Course.find({ isPaid: false }).limit(10).lean(),
    Blog.find({ published: true }).limit(5).lean(),
  ]);
  return { freeCourses, blogs };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select("-password").lean();
};

export const updateProfile = async (userId, data) => {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
};

export const getFreeCourses = async () => {
  return Course.find({ isPaid: false }).lean();
};

export const getBlogs = async () => {
  return Blog.find({ published: true }).lean();
};

export const getUserSubscription = async (userId) => {
  return Subscription.findOne({ userId, status: "ACTIVE" }).lean();
};

export const userHasPaidSubscription = async (userId) => {
  const sub = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    plan: { $ne: "FREE" },
    endDate: { $gt: new Date() },
  }).lean();
  return !!sub;
};

export const getUserPayments = async (userId) => {
  return Payment.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getAllCourses = async () => {
  return Course.find().lean();
};

export const getCourseById = async (courseId) => {
  return Course.findById(courseId).lean();
};

export const canAccessCourse = async (userId, course) => {
  if (!course.isPaid) return true;
  return userHasPaidSubscription(userId);
};

export const getPaidCourses = async () => {
  return Course.find({ isPaid: true }).lean();
};

export const getAllNotes = async () => {
  return Note.find().lean();
};

export const getNoteById = async (noteId) => {
  return Note.findById(noteId).lean();
};

export const getFreeNotes = async () => {
  return Note.find({ isFree: true }).lean();
};

export const getPaidNotes = async () => {
  return Note.find({ isFree: false }).lean();
};

export const canAccessNote = async (userId, note) => {
  if (note.isFree) return true;
  return userHasPaidSubscription(userId);
};

export const incrementNoteDownloadCount = async (noteId) => {
  await Note.findByIdAndUpdate(noteId, { $inc: { downloadCount: 1 } });
};