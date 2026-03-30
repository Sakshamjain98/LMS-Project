import * as service from "./student.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { activityQueue } from "../../infrastucture/queues/activity.queue.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";
import Test from "../test/test.model.js";
export const dashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboardData(); try {
    await activityQueue.add("dashboard_view", {
      userId: req.user._id,
      role: req.user.role,
      action: "STUDENT_DASHBOARD_VIEW",
    }, { timeout: 5000 }); // set a timeout
  } catch (err) {
    console.error("Failed to add activity job:", err.message);
    // Do not fail the request
  }

  const subscription = await service.getUserSubscription(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    subscription: subscription?.plan || "FREE",
    ...data,
  });
});

export const profile = asyncHandler(async (req, res) => {
  await activityQueue.add("profile_view", { userId: req.user._id });
  const user = await service.getProfile(req.user._id);
  const subscription = await service.getUserSubscription(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    user,
    subscription: subscription || {
      plan: "FREE",
      status: "ACTIVE",
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await service.updateProfile(req.user._id, req.body);
  await activityQueue.add("profile_update", { userId: user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PROFILE_UPDATED,
    user,
  });
});

export const freeCourses = asyncHandler(async (req, res) => {
  await activityQueue.add("free_courses_view", { userId: req.user._id });
  const courses = await service.getFreeCourses();
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    courses,
  });
});

export const blogs = asyncHandler(async (req, res) => {
  await activityQueue.add("blogs_view", { userId: req.user._id });
  const blogList = await service.getBlogs();
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    blogs: blogList,
  });
});

export const schedule = asyncHandler(async (req, res) => {
  await activityQueue.add("schedule_view", { userId: req.user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    schedule: [],
  });
});

export const paymentHistory = asyncHandler(async (req, res) => {
  await activityQueue.add("payment_history_view", { userId: req.user._id });
  const payments = await service.getUserPayments(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    payments,
  });
});

export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await service.getAllCourses();
  const canAccessPaid = await service.userHasPaidSubscription(req.user._id);
  const enriched = courses.map(course => ({
    ...course,
    isAccessible: !course.isPaid || canAccessPaid,
  }));
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    courses: enriched,
  });
});

export const getCourseDetails = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user._id;

  const course = await service.getCourseById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  const canAccess = await service.canAccessCourse(userId, course);
  if (!canAccess) {
    throw new ApiError(403, "You need a paid subscription to access this course");
  }

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    course,
  });
});

export const paidCourses = asyncHandler(async (req, res) => {
  const courses = await service.getPaidCourses();
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    courses,
  });
});

export const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await service.getAllNotes();
  const canAccessPaid = await service.userHasPaidSubscription(req.user._id);
  const enriched = notes.map(note => ({
    ...note,
    isAccessible: note.isFree || canAccessPaid,
  }));
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    notes: enriched,
  });
});

export const getNoteDetails = asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const userId = req.user._id;

  const note = await service.getNoteById(noteId);
  if (!note) throw new ApiError(404, "Note not found");

  const canAccess = await service.canAccessNote(userId, note);
  if (!canAccess) {
    throw new ApiError(403, "You need a paid subscription to access this note");
  }

  // Optional: increment download count
  await service.incrementNoteDownloadCount(noteId);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    note,
  });
});

// Update freeNotes to use actual service
export const freeNotes = asyncHandler(async (req, res) => {
  await activityQueue.add("free_notes_view", { userId: req.user._id });
  const notes = await service.getFreeNotes();
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    notes,
  });
});





// Update paidNotes to return only paid notes (already protected by middleware)
export const paidNotes = asyncHandler(async (req, res) => {
  const notes = await service.getPaidNotes();
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    notes,
  });
});

export const getAvailableTests = asyncHandler(async (req, res) => {
  const tests = await Test.find({ status: "published" })
    .select("_id title description duration totalMarks")
    .lean();
  
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    tests,
  });
});





