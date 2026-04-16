import User from "../../models/user.model.js";
import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import Payment from "../../models/payment.model.js";
import News from "../../models/news.model.js";
import Comment from "../../models/comment.model.js";
import SubscriptionPlan from "../../models/subscriptionPlan.model.js";
import Test from "../../models/test.model.js"
import TestAttempt from "../../models/testAttempt.model.js";
import PlatformSettings, { DEFAULT_TEACHER_SETTINGS } from "../../models/platformSettings.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { comparePassword, hashPassword } from "../../shared/utils/bcrypt.js";

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

export const getAdmins = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const filter = { role: "admin" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [admins, total] = await Promise.all([
    User.find(filter)
      .select("name email role isApproved createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    admins,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const updateAdminInfo = async (adminId, payload) => {
  const admin = await User.findOne({ _id: adminId, role: "admin" });
  if (!admin) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Admin not found");
  }

  if (payload.email && payload.email !== admin.email) {
    const existing = await User.findOne({ email: payload.email.trim().toLowerCase() });
    if (existing && existing._id.toString() !== adminId.toString()) {
      throw new ApiError(STATUS_CODES.CONFLICT, "Email already in use");
    }
  }

  if (payload.name !== undefined) {
    admin.name = payload.name.trim();
  }

  if (payload.email !== undefined) {
    admin.email = payload.email.trim().toLowerCase();
  }

  if (payload.password) {
    admin.password = await hashPassword(payload.password);
  }

  admin.role = "admin";
  admin.isApproved = true;
  await admin.save();

  return User.findById(adminId).select("name email role isApproved createdAt").lean();
};

export const deleteAdminById = async (adminId, currentAdminId) => {
  if (adminId.toString() === currentAdminId.toString()) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "You cannot delete your own admin account");
  }

  const deleted = await User.findOneAndDelete({ _id: adminId, role: "admin" });
  if (!deleted) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Admin not found");
  }

  return deleted;
};

export const getAdminProfile = async (adminId) => {
  const profile = await User.findOne({ _id: adminId, role: "admin" })
    .select("name email role phone avatar createdAt updatedAt")
    .lean();

  if (!profile) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Admin profile not found");
  }

  return profile;
};

export const updateAdminProfile = async (adminId, payload) => {
  const updates = {};

  if (payload.name !== undefined) {
    updates.name = payload.name.trim();
  }

  if (payload.phone !== undefined) {
    updates.phone = payload.phone?.trim() || "";
  }

  if (payload.avatar !== undefined) {
    updates.avatar = payload.avatar?.trim() || "";
  }

  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== adminId.toString()) {
      throw new ApiError(STATUS_CODES.CONFLICT, "Email already in use");
    }
    updates.email = email;
  }

  const profile = await User.findOneAndUpdate(
    { _id: adminId, role: "admin" },
    { $set: updates },
    { new: true }
  )
    .select("name email role phone avatar createdAt updatedAt")
    .lean();

  if (!profile) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Admin profile not found");
  }

  return profile;
};

export const changeAdminPassword = async (adminId, payload) => {
  if (!payload.currentPassword || !payload.newPassword) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Current password and new password are required");
  }

  if (payload.newPassword.length < 6) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "New password must be at least 6 characters");
  }

  const admin = await User.findOne({ _id: adminId, role: "admin" }).select("+password");
  if (!admin) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Admin account not found");
  }

  const valid = await comparePassword(payload.currentPassword, admin.password || "");
  if (!valid) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Current password is incorrect");
  }

  admin.password = await hashPassword(payload.newPassword);
  await admin.save();

  return true;
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
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role isApproved createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const updateUserRole = async (userId, role) => {
  return User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
};

export const deleteUser = async (userId) => {
  return User.findByIdAndDelete(userId);
};

// -------------------- Pending Content (Courses & Blogs) --------------------
export const getPendingContent = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const type = query.type || "courses";
  const search = query.search?.trim();

  if (type === "blogs") {
    const blogFilter = { published: false };
    if (search) {
      blogFilter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const [pendingBlogs, total] = await Promise.all([
      Blog.find(blogFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments(blogFilter),
    ]);

    return {
      content: { pendingCourses: [], pendingBlogs },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  const courseFilter = { status: "pending" };
  if (search) {
    courseFilter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [pendingCourses, total] = await Promise.all([
    Course.find(courseFilter)
      .populate("educator", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(courseFilter),
  ]);

  return {
    content: { pendingCourses, pendingBlogs: [] },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
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
export const getAllPayments = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const status = query.status?.trim();
  const search = query.search?.trim();

  const filter = {};
  if (status) {
    filter.status = status;
  }

  if (search) {
    const users = await User.find(
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
      "_id"
    ).lean();

    const userIds = users.map((u) => u._id);
    filter.$or = [
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      { orderId: { $regex: search, $options: "i" } },
      { paymentId: { $regex: search, $options: "i" } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
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
  return Blog.create({
    ...data,
    author: adminId,
    published: data.published !== undefined ? data.published : true,
  });
};

export const updateBlog = async (blogId, data) => {
  const blog = await Blog.findByIdAndUpdate(
    blogId,
    {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
    },
    { new: true }
  );

  if (!blog) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Blog not found");
  }

  return blog;
};

export const deleteBlog = async (blogId) => {
  return Blog.findByIdAndDelete(blogId);
};

// -------------------- Teacher Approval --------------------
export const getPendingTeachers = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const filter = { role: "teacher", isApproved: false };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [teachers, total] = await Promise.all([
    User.find(filter)
      .select("name email role isApproved createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
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
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const search = query.search?.trim();
  const filter = {};
  if (published !== undefined) filter.published = published === 'true';

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const [news, total] = await Promise.all([
    News.find(filter)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments(filter),
  ]);

  return {
    news,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
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


export const getBlogs = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const search = query.search?.trim();

  const filter = {};
  if (query.published !== undefined) {
    filter.published = query.published === true || query.published === "true";
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  return {
    blogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getTeacherSettings = async () => {
  const settings = await PlatformSettings.findOne({ key: "singleton" }).lean();

  if (!settings) {
    return DEFAULT_TEACHER_SETTINGS;
  }

  return {
    teacherVisibility: {
      ...DEFAULT_TEACHER_SETTINGS.teacherVisibility,
      ...(settings.teacherVisibility || {}),
    },
    teacherDashboardStats: {
      ...DEFAULT_TEACHER_SETTINGS.teacherDashboardStats,
      ...(settings.teacherDashboardStats || {}),
    },
  };
};

export const updateTeacherSettings = async (payload) => {
  const teacherVisibility = {
    ...DEFAULT_TEACHER_SETTINGS.teacherVisibility,
    ...(payload.teacherVisibility || {}),
  };

  const teacherDashboardStats = {
    ...DEFAULT_TEACHER_SETTINGS.teacherDashboardStats,
    ...(payload.teacherDashboardStats || {}),
  };

  const settings = await PlatformSettings.findOneAndUpdate(
    { key: "singleton" },
    {
      $set: {
        teacherVisibility,
        teacherDashboardStats,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    teacherVisibility: settings.teacherVisibility,
    teacherDashboardStats: settings.teacherDashboardStats,
  };
};