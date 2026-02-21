import * as service from "./admin.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";




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



/* ================= DASHBOARD ================= */
export const dashboard = asyncHandler(async (req, res) => {
  const data = await service.getAdminDashboard();

  res.json({
    success: true,
    message: "Admin dashboard fetched",
    data,
  });
});

/* ================= USER MANAGEMENT ================= */
export const users = asyncHandler(async (req, res) => {
  const users = await service.getAllUsers(req.query);

  res.json({
    success: true,
    users,
  });
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = await service.updateUserRole(
    req.params.id,
    req.body.role
  );

  res.json({
    success: true,
    message: "User role updated",
    user,
  });
});

export const removeUser = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id);

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

/* ================= CONTENT MODERATION ================= */
export const pendingContent = asyncHandler(async (req, res) => {
  const content = await service.getPendingContent();

  res.json({
    success: true,
    content,
  });
});

export const approveCourse = asyncHandler(async (req, res) => {
  const course = await service.approveCourse(req.params.id);

  res.json({
    success: true,
    message: "Course approved",
    course,
  });
});

export const rejectCourse = asyncHandler(async (req, res) => {
  await service.rejectCourse(req.params.id);

  res.json({
    success: true,
    message: "Course rejected & removed",
  });
});

/* ================= PAYMENTS ================= */
export const payments = asyncHandler(async (req, res) => {
  const payments = await service.getAllPayments();

  res.json({
    success: true,
    payments,
  });
});

export const refund = asyncHandler(async (req, res) => {
  const payment = await service.refundPayment(req.params.id);

  res.json({
    success: true,
    message: "Payment refunded",
    payment,
  });
});

/* ================= CMS ================= */
export const createBlog = asyncHandler(async (req, res) => {
  const blog = await service.createBlog(req.body, req.user._id);

  res.json({
    success: true,
    message: "Blog created",
    blog,
  });
});

export const deleteBlog = asyncHandler(async (req, res) => {
  await service.deleteBlog(req.params.id);

  res.json({
    success: true,
    message: "Blog deleted",
  });
});




// admin.controller.js
export const pendingTeachers = asyncHandler(async (req, res) => {
  const teachers = await service.getPendingTeachers();
  res.json({ success: true, teachers });
});

export const approveTeacher = asyncHandler(async (req, res) => {
  const user = await service.approveTeacher(req.params.id);
  res.json({ success: true, message: 'Teacher approved', user });
});