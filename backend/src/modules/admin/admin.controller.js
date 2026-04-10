import * as service from "./admin.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

// -------------------- Admin Creation --------------------
export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const admin = await service.createAdminService({ name, email, password });
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Admin created successfully",
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// -------------------- Dashboard --------------------
export const dashboard = asyncHandler(async (req, res) => {
  const data = await service.getAdminDashboard();
  res.json({ success: true, message: "Admin dashboard fetched", data });
});

// -------------------- User Management --------------------
export const users = asyncHandler(async (req, res) => {
  const users = await service.getAllUsers(req.query);
  res.json({ success: true, users });
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await service.updateUserRole(req.params.id, req.body.role);
  res.json({ success: true, message: "User role updated", user });
});

export const removeUser = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});

// -------------------- Pending Content --------------------
export const pendingContent = asyncHandler(async (req, res) => {
  const content = await service.getPendingContent();
  res.json({ success: true, content });
});

// -------------------- Course Approval / Rejection --------------------
export const approveCourse = asyncHandler(async (req, res) => {
  const course = await service.approveCourse(req.params.id);
  res.json({ success: true, message: "Course approved", course });
});

export const rejectCourse = asyncHandler(async (req, res) => {
  const course = await service.rejectCourse(req.params.id);
  res.json({ success: true, message: "Course rejected (soft delete)", course });
});

// -------------------- Payment Management --------------------
export const payments = asyncHandler(async (req, res) => {
  const payments = await service.getAllPayments();
  res.json({ success: true, payments });
});

export const refund = asyncHandler(async (req, res) => {
  const payment = await service.refundPayment(req.params.id);
  res.json({ success: true, message: "Payment refunded", payment });
});

// -------------------- Blog Management --------------------
export const createBlog = asyncHandler(async (req, res) => {
  const blog = await service.createBlog(req.body, req.user._id);
  res.json({ success: true, message: "Blog created", blog });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  await service.deleteBlog(req.params.id);
  res.json({ success: true, message: "Blog deleted" });
});

// -------------------- Teacher Approval --------------------
export const pendingTeachers = asyncHandler(async (req, res) => {
  const teachers = await service.getPendingTeachers();
  res.json({ success: true, teachers });
});

export const approveTeacher = asyncHandler(async (req, res) => {
  const user = await service.approveTeacher(req.params.id);
  res.json({ success: true, message: 'Teacher approved', user });
});

// -------------------- NEWS MANAGEMENT --------------------
export const createNews = asyncHandler(async (req, res) => {
  const news = await service.createNews(req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, news });
});

export const updateNews = asyncHandler(async (req, res) => {
  const news = await service.updateNews(req.params.id, req.body);
  res.json({ success: true, news });
});

export const deleteNews = asyncHandler(async (req, res) => {
  await service.deleteNews(req.params.id);
  res.json({ success: true, message: "News deleted" });
});

export const getAllNews = asyncHandler(async (req, res) => {
  const news = await service.getAllNews(req.query);
  res.json({ success: true, news });
});

export const getNewsById = asyncHandler(async (req, res) => {
  const news = await service.getNewsById(req.params.id);
  res.json({ success: true, news });
});

// -------------------- COMMENT MODERATION --------------------
export const getPendingComments = asyncHandler(async (req, res) => {
  const comments = await service.getPendingComments();
  res.json({ success: true, comments });
});

export const approveComment = asyncHandler(async (req, res) => {
  const comment = await service.approveComment(req.params.id);
  res.json({ success: true, comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  await service.deleteComment(req.params.id);
  res.json({ success: true, message: "Comment deleted" });
});

export const getAllComments = asyncHandler(async (req, res) => {
  const comments = await service.getAllComments(req.query);
  res.json({ success: true, comments });
});

// -------------------- SUBSCRIPTION PLAN MANAGEMENT --------------------
export const createPlan = asyncHandler(async (req, res) => {
  const plan = await service.createPlan(req.body);
  res.status(STATUS_CODES.CREATED).json({ success: true, plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await service.updatePlan(req.params.id, req.body);
  res.json({ success: true, plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  await service.deletePlan(req.params.id);
  res.json({ success: true, message: "Plan deleted" });
});

export const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await service.getAllPlans();
  res.json({ success: true, plans });
});

// -------------------- DETAILED ANALYTICS --------------------
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const data = await service.getRevenueAnalytics(period);
  res.json({ success: true, data });
});

export const getUserAnalytics = asyncHandler(async (req, res) => {
  const data = await service.getUserAnalytics();
  res.json({ success: true, data });
});

export const getTestAnalytics = asyncHandler(async (req, res) => {
  const data = await service.getTestAnalytics();
  res.json({ success: true, data });
});

export const getCourseAnalytics = asyncHandler(async (req, res) => {
  const data = await service.getCourseAnalytics();
  res.json({ success: true, data });
});



export const getBlogs = asyncHandler(async (req, res) => {
  const { published } = req.query; // Optional filter for published blogs
  const filter = {};

  if (published !== undefined) {
    filter.published = published === "true";
  }

  const blogs = await service.getBlogs(filter);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Blogs fetched successfully",
    blogs,
  });
});