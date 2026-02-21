import { getDashboardData } from "./student.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { activityQueue } from "../../infrastucture/queues/activity.queue.js";
import * as service from "./student.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboardData();
  await activityQueue.add("dashboard_view", {
    userId: req.user._id,
    role: req.user.role,
    action: "STUDENT_DASHBOARD_VIEW",
  });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    subscription: "FREE",
    ...data,
  });
});

export const profile = asyncHandler(async (req, res) => {
  await activityQueue.add("profile_view", {
    userId: req.user._id,
  });

  const user = await service.getProfile(req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await service.updateProfile(req.user._id, req.body);

  await activityQueue.add("profile_update", {
    userId: user._id,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PROFILE_UPDATED,
    user,
  });
});

export const freeCourses = asyncHandler(async (req, res) => {
  await activityQueue.add("free_courses_view", {
    userId: req.user._id,
  });

  const courses = await service.getFreeCourses();

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    courses,
  });
});

export const freeNotes = asyncHandler(async (req, res) => {
  await activityQueue.add("free_notes_view", {
    userId: req.user._id,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    notes: [],
  });
});

export const blogs = asyncHandler(async (req, res) => {
  await activityQueue.add("blogs_view", {
    userId: req.user._id,
  });

  const blogList = await service.getBlogs();

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    blogs: blogList,
  });
});

export const schedule = asyncHandler(async (req, res) => {
  await activityQueue.add("schedule_view", {
    userId: req.user._id,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    schedule: [],
  });
});

export const paymentHistory = asyncHandler(async (req, res) => {
  await activityQueue.add("payment_history_view", {
    userId: req.user._id,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    payments: [],
  });
});
