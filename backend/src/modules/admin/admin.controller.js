import * as service from "./admin.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

// -------------------- Admin Creation --------------------
export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, permissions } = req.body;
  const admin = await service.createAdminService({ name, email, password, permissions });
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Admin created successfully",
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    },
  });
});

export const getAdmins = asyncHandler(async (req, res) => {
  const result = await service.getAdmins(req.query);
  res.json({ success: true, ...result });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await service.updateAdminInfo(req.params.id, req.body);
  res.json({ success: true, message: "Admin updated successfully", admin });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  await service.deleteAdminById(req.params.id, req.user._id);
  res.json({ success: true, message: "Admin deleted successfully" });
});

export const resetAdminPassword = asyncHandler(async (req, res) => {
  await service.resetAdminPassword(req.params.id, req.body?.newPassword);
  res.json({ success: true, message: "Admin password reset successfully" });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const profile = await service.getAdminProfile(req.user._id);
  res.json({ success: true, profile });
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const profile = await service.updateAdminProfile(req.user._id, req.body || {});
  res.json({ success: true, message: "Profile updated successfully", profile });
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  await service.changeAdminPassword(req.user._id, { currentPassword, newPassword });
  res.json({ success: true, message: "Password changed successfully" });
});

// -------------------- Dashboard --------------------
export const dashboard = asyncHandler(async (req, res) => {
  const data = await service.getAdminDashboard();
  res.json({ success: true, message: "Admin dashboard fetched", data });
});

// -------------------- User Management --------------------
export const users = asyncHandler(async (req, res) => {
  const result = await service.getAllUsers(req.query);
  res.json({ success: true, ...result });
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await service.updateUserRole(req.params.id, req.body.role);
  res.json({ success: true, message: "User role updated", user });
});

export const removeUser = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});

// -------------------- Subscription / Access Management --------------------
export const userSubscription = asyncHandler(async (req, res) => {
  const data = await service.getUserSubscriptionDetail(req.params.id);
  res.json({ success: true, ...data });
});

export const disableUserAccess = asyncHandler(async (req, res) => {
  const subscription = await service.disableUserAccess(
    req.params.id,
    req.user._id,
    req.body?.reason
  );
  res.json({
    success: true,
    message: "Premium access disabled. The user must repay to reactivate.",
    subscription,
  });
});

export const enableUserAccess = asyncHandler(async (req, res) => {
  const subscription = await service.enableUserAccess(req.params.id, req.user._id, req.body || {});
  res.json({ success: true, message: "Access re-enabled", subscription });
});

export const extendUserAccess = asyncHandler(async (req, res) => {
  const subscription = await service.extendUserAccess(req.params.id, req.user._id, req.body || {});
  res.json({ success: true, message: "Access extended", subscription });
});

export const grantUserPlan = asyncHandler(async (req, res) => {
  const subscription = await service.grantUserPlan(req.params.id, req.user._id, req.body || {});
  res.json({ success: true, message: "Plan granted", subscription });
});

// One-time content purchases (courses / test series)
export const userContentAccess = asyncHandler(async (req, res) => {
  const data = await service.getUserContentAccess(req.params.id);
  res.json({ success: true, ...data });
});

export const setCourseAccess = asyncHandler(async (req, res) => {
  const grant = await service.setCourseAccessDisabled(
    req.params.id,
    req.params.courseId,
    req.body?.disabled
  );
  res.json({
    success: true,
    message: req.body?.disabled
      ? "Course access revoked — user must repay to reaccess."
      : "Course access restored.",
    grant,
  });
});

export const setTopicAccess = asyncHandler(async (req, res) => {
  const grant = await service.setTopicAccessDisabled(
    req.params.id,
    req.params.topicId,
    req.body?.disabled
  );
  res.json({
    success: true,
    message: req.body?.disabled
      ? "Test series access revoked — user must repay to reaccess."
      : "Test series access restored.",
    grant,
  });
});

// Extend / change expiry / reactivate a single course grant.
export const extendCourseAccess = asyncHandler(async (req, res) => {
  const grant = await service.setCourseAccessExpiry(req.params.id, req.params.courseId, {
    days: req.body?.days,
    until: req.body?.until,
  });
  res.json({ success: true, message: "Course access updated.", grant });
});

// Extend / change expiry / reactivate a single test series grant.
export const extendTopicAccess = asyncHandler(async (req, res) => {
  const grant = await service.setTopicAccessExpiry(req.params.id, req.params.topicId, {
    days: req.body?.days,
    until: req.body?.until,
  });
  res.json({ success: true, message: "Test series access updated.", grant });
});

// -------------------- Pending Content --------------------
export const pendingContent = asyncHandler(async (req, res) => {
  const result = await service.getPendingContent(req.query);
  res.json({ success: true, ...result });
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
  const result = await service.getAllPayments(req.query);
  res.json({ success: true, ...result });
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

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await service.updateBlog(req.params.id, req.body);
  res.json({ success: true, message: "Blog updated", blog });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  await service.deleteBlog(req.params.id);
  res.json({ success: true, message: "Blog deleted" });
});

// -------------------- Teacher Approval --------------------
export const pendingTeachers = asyncHandler(async (req, res) => {
  const result = await service.getPendingTeachers(req.query);
  res.json({ success: true, ...result });
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
  const result = await service.getAllNews(req.query);
  res.json({ success: true, ...result });
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

export const getTeacherSettings = asyncHandler(async (req, res) => {
  const settings = await service.getTeacherSettings();
  res.json({ success: true, settings });
});

export const updateTeacherSettings = asyncHandler(async (req, res) => {
  const settings = await service.updateTeacherSettings(req.body || {});
  res.json({ success: true, message: "Teacher settings updated", settings });
});



export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await service.getBlogById(req.params.id);
  res.json({ success: true, blog });
});

// -------------------- Site Content --------------------
export const getSiteContent = asyncHandler(async (_req, res) => {
  const data = await service.getSiteContent();
  res.json({ success: true, data });
});

export const updateSiteContent = asyncHandler(async (req, res) => {
  const data = await service.updateSiteContent(req.body || {});
  res.json({ success: true, message: "Site content updated", data });
});

// Multer + Cloudinary middleware writes the uploaded file to Cloudinary;
// the resulting URL lives on `req.file.path`.
export const uploadSiteImage = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ success: false, message: "No image uploaded" });
  }
  res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename,
  });
});

export const getBlogs = asyncHandler(async (req, res) => {
  const result = await service.getBlogs(req.query);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Blogs fetched successfully",
    ...result,
  });
});