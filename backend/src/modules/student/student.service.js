import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";
import Subscription from "../../models/subscription.model.js";
import Payment from "../../models/payment.model.js";
import Note from "../../models/note.model.js";
export const getDashboardData = async () => {
  const [freeCourses, blogs] = await Promise.all([
    Course.find({ isPaid: false, status: "approved" })
      .limit(10)
      .lean(),
    Blog.find({ published: true })
      .limit(5)
      .lean(),
  ]);

  return { freeCourses, blogs };
};

export const getProfile = async (userId) => {
  return User.findById(userId)
    .select("-password")
    .lean(); // ✅ faster
};

export const updateProfile = async (userId, data) => {
  const updates = {};

  if (data?.name !== undefined) {
    updates.name = String(data.name).trim();
  }

  if (data?.phone !== undefined) {
    updates.phone = String(data.phone || "").trim();
  }

  if (data?.avatar !== undefined) {
    updates.avatar = String(data.avatar || "").trim();
  }

  return User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true } // ✅ important
  ).select("-password");
};

export const getFreeCourses = async () => {
  return Course.find({ isPaid: false, status: "approved" }).lean();        
};

export const getBlogs = async () => {
  return Blog.find({ published: true }).lean();
};

export const getUserSubscription = async (userId) => {
  return Subscription.findOne({
    userId,
    status: "ACTIVE",
    $or: [{ plan: "FREE" }, { endDate: { $gt: new Date() } }],
  }).lean();
};

export const userHasPaidSubscription = async (userId) => {
  const sub = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    plan: { $ne: "FREE" },
    endDate: { $gt: new Date() },
  }).lean();

  if (!sub) return false;

  // Extra security: verify the underlying payment was admin-approved
  const approvedPayment = await Payment.findOne({
    userId,
    plan: sub.plan,
    status: "SUCCESS",
    adminApproved: true,
  }).lean();

  return !!approvedPayment;
};

export const getUserPayments = async (userId, { page = 1, limit = 10 } = {}) => {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const [payments, total] = await Promise.all([
    Payment.find({ userId }).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
    Payment.countDocuments({ userId }),
  ]);
  return {
    payments,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.max(Math.ceil(total / l), 1),
      hasNextPage: p * l < total,
      hasPrevPage: p > 1,
    },
  };
};

export const getAllCourses = async () => {
  return Course.find({ status: "approved" }).lean();                      
};

export const getCourseById = async (courseId) => {
  const course = await Course.findOne({ _id: courseId, status: "approved" }).lean(); // ✅ filter by id + approved
  return course;  // will be null if not approved or not found
};

export const canAccessCourse = async (userId, course) => {
  if (!course.isPaid) return true;
  return userHasPaidSubscription(userId);
};


export const getPaidCourses = async () => {
  return Course.find({ isPaid: true, status: "approved" }).lean();       
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
