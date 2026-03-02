import User from "../../models/user.model.js";
import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import Payment from "../../models/payment.model.js";
import News from "../../models/news.model.js";
import Comment from "../../models/comment.model.js";
import SubscriptionPlan from "../../models/subscriptionPlan.model.js";
import Test from "../../models/test.model.js"
import TestAttempt from "../../models/testAttempt.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { hashPassword } from "../../shared/utils/bcrypt.js";

// -------------------- Admin Creation --------------------
export const createAdminService = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(STATUS_CODES.CONFLICT, "Admin with this email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isApproved: true,
  });

  return admin;
};

// -------------------- Dashboard Stats --------------------
export const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalBlogs,
    totalRevenue,
    pendingCourses,
    pendingTeachers,
    pendingComments,
    totalNews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Course.countDocuments(),
    Blog.countDocuments(),
    Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Course.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "teacher", isApproved: false }),
    Comment.countDocuments({ approved: false }),
    News.countDocuments(),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalBlogs,
    totalRevenue: totalRevenue[0]?.total || 0,
    pendingCourses,
    pendingTeachers,
    pendingComments,
    totalNews,
  };
};

// -------------------- User Management --------------------
export const getAllUsers = async (query) => {
  const { role, search } = query;
  let filter = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: search, $options: "i" };
  return User.find(filter).select("-password").sort({ createdAt: -1 });
};

export const updateUserRole = async (userId, role) => {
  return User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
};

export const deleteUser = async (userId) => {
  return User.findByIdAndDelete(userId);
};

// -------------------- Pending Content (Courses & Blogs) --------------------
export const getPendingContent = async () => {
  const pendingCourses = await Course.find({ status: "pending" });
  const pendingBlogs = await Blog.find({ published: false });
  return { pendingCourses, pendingBlogs };
};

// -------------------- Course Approval / Rejection (Soft) --------------------
export const approveCourse = async (courseId) => {
  return Course.findByIdAndUpdate(
    courseId,
    { status: "approved", isApproved: true },
    { new: true }
  );
};

export const rejectCourse = async (courseId) => {
  // Soft reject: mark as rejected instead of delete
  return Course.findByIdAndUpdate(
    courseId,
    { status: "rejected", isApproved: false },
    { new: true }
  );
};

// Optional: restore a rejected course
export const restoreCourse = async (courseId) => {
  return Course.findByIdAndUpdate(
    courseId,
    { status: "pending", isApproved: false },
    { new: true }
  );
};

// -------------------- Payment Management --------------------
export const getAllPayments = async () => {
  return Payment.find().populate("userId", "name email").sort({ createdAt: -1 });
};

export const refundPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");
  payment.status = "REFUNDED";
  await payment.save();
  return payment;
};

// -------------------- Blog Management --------------------
export const createBlog = async (data, adminId) => {
  return Blog.create({ ...data, author: adminId, published: true });
};

export const deleteBlog = async (blogId) => {
  return Blog.findByIdAndDelete(blogId);
};

// -------------------- Teacher Approval --------------------
export const getPendingTeachers = async () => {
  return User.find({ role: 'teacher', isApproved: false }).select('-password');
};

export const approveTeacher = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isApproved: true },
    { new: true }
  ).select('-password');
  if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, 'User not found');
  return user;
};

// -------------------- NEWS MANAGEMENT --------------------
export const createNews = async (data, adminId) => {
  return News.create({ ...data, author: adminId });
};

export const updateNews = async (newsId, data) => {
  return News.findByIdAndUpdate(newsId, data, { new: true });
};

export const deleteNews = async (newsId) => {
  return News.findByIdAndDelete(newsId);
};

export const getAllNews = async (query) => {
  const { published } = query;
  const filter = {};
  if (published !== undefined) filter.published = published === 'true';
  return News.find(filter).populate('author', 'name email').sort({ createdAt: -1 });
};

export const getNewsById = async (newsId) => {
  return News.findById(newsId).populate('author', 'name email');
};

// -------------------- COMMENT MODERATION --------------------
export const getPendingComments = async () => {
  return Comment.find({ approved: false })
    .populate('user', 'name email')
    .populate('blog', 'title');
};

export const approveComment = async (commentId) => {
  return Comment.findByIdAndUpdate(commentId, { approved: true }, { new: true });
};

export const deleteComment = async (commentId) => {
  return Comment.findByIdAndDelete(commentId);
};

export const getAllComments = async (query) => {
  const { approved, blogId } = query;
  const filter = {};
  if (approved !== undefined) filter.approved = approved === 'true';
  if (blogId) filter.blog = blogId;
  return Comment.find(filter)
    .populate('user', 'name email')
    .populate('blog', 'title')
    .sort({ createdAt: -1 });
};

// -------------------- SUBSCRIPTION PLAN MANAGEMENT --------------------
export const createPlan = async (data) => {
  return SubscriptionPlan.create(data);
};

export const updatePlan = async (planId, data) => {
  return SubscriptionPlan.findByIdAndUpdate(planId, data, { new: true });
};

export const deletePlan = async (planId) => {
  return SubscriptionPlan.findByIdAndDelete(planId);
};

export const getAllPlans = async () => {
  return SubscriptionPlan.find().sort({ price: 1 });
};

// -------------------- DETAILED ANALYTICS --------------------
export const getRevenueAnalytics = async (period = 'monthly') => {
  let groupBy;
  if (period === 'daily') {
    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  } else if (period === 'monthly') {
    groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
  } else {
    groupBy = { $dateToString: { format: "%Y", date: "$createdAt" } };
  }

  const revenue = await Payment.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: groupBy, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  return revenue;
};

export const getUserAnalytics = async () => {
  const total = await User.countDocuments();
  const byRole = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
  const recent = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 30 }
  ]);
  return { total, byRole, recent };
};

export const getTestAnalytics = async () => {
  const totalTests = await Test.countDocuments();
  const totalAttempts = await TestAttempt.countDocuments();
  const avgScore = await TestAttempt.aggregate([
    { $group: { _id: null, avg: { $avg: "$score" } } }
  ]);
  const attemptsByTest = await TestAttempt.aggregate([
    { $group: { _id: "$test", count: { $sum: 1 } } },
    { $lookup: { from: "tests", localField: "_id", foreignField: "_id", as: "test" } },
    { $unwind: "$test" },
    { $project: { testName: "$test.title", attempts: "$count" } }
  ]);
  return {
    totalTests,
    totalAttempts,
    avgScore: avgScore[0]?.avg || 0,
    attemptsByTest
  };
};

export const getCourseAnalytics = async () => {
  const totalCourses = await Course.countDocuments();
  const byStatus = await Course.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  return { totalCourses, byStatus };
};