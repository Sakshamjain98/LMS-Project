import User from "../../models/user.model.js";
import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import Payment from "../../models/payment.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { hashPassword } from "../../shared/utils/bcrypt.js"; // for createAdmin



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
    isApproved: true, // admins are always approved
  });

  return admin;
};







export const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalBlogs,
    totalRevenue,
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
  ]);

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    totalBlogs,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
};



/* ================= USER MANAGEMENT ================= */

export const getAllUsers = async (query) => {
  const { role, search } = query;

  let filter = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: search, $options: "i" };

  return User.find(filter).select("-password").sort({ createdAt: -1 });
};

export const updateUserRole = async (userId, role) => {
  return User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("-password");
};

export const deleteUser = async (userId) => {
  return User.findByIdAndDelete(userId);
};

/* ================= CONTENT MODERATION ================= */

export const getPendingContent = async () => {
  const pendingCourses = await Course.find({ isApproved: false });
  const pendingBlogs = await Blog.find({ published: false });

  return { pendingCourses, pendingBlogs };
};

export const approveCourse = async (courseId) => {
  return Course.findByIdAndUpdate(
    courseId,
    { isApproved: true },
    { new: true }
  );
};

export const rejectCourse = async (courseId) => {
  return Course.findByIdAndDelete(courseId);
};

/* ================= PAYMENTS & SUBSCRIPTIONS ================= */

export const getAllPayments = async () => {
  return Payment.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};

export const refundPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  payment.status = "REFUNDED";
  await payment.save();
  return payment;
};

/* ================= CMS MANAGEMENT ================= */

export const createBlog = async (data, adminId) => {
  return Blog.create({
    ...data,
    author: adminId,
    published: true,
  });
};

export const deleteBlog = async (blogId) => {
  return Blog.findByIdAndDelete(blogId);
};




// admin.service.js
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




