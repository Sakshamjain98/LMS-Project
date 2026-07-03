import * as service from "./student.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { activityQueue } from "../../infrastucture/queues/activity.queue.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";
import * as testSeriesService from "../testSeries/testSeries.service.js";
import TopicAccess from "../../models/topicAccess.model.js";

export const dashboard = asyncHandler(async (req, res) => {
  // 1. Fetch dashboard data
  const data = await service.getDashboardData();

  // 2. Fetch subscription
  const subscription = await service.getUserSubscription(req.user._id);

  // 3. Send response
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    subscription: subscription?.plan || "FREE",
    ...data,
  });
});
export const profile = asyncHandler(async (req, res) => {
  // 1. Get user profile
  const user = await service.getProfile(req.user._id);

  // 2. Get subscription
  const subscription = await service.getUserSubscription(req.user._id);

  // 3. Send response
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
  const result = await service.getUserPayments(req.user._id, req.query);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    ...result,
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
  const userId = req.user._id;
  const now = new Date();

  // Flat topic list for backward-compatible `topics` key (used by SeriesDetail)
  const topics = await testSeriesService.getStudentSeriesTree();

  // Full hierarchy for the new category/exam browse flow
  const categories = await testSeriesService.getFullHierarchyTree({ publishedOnly: true });

  const flatAitsSections = categories.flatMap((cat) =>
    (cat.exams || []).flatMap((exam) =>
      (exam.allIndiaTestSeries || []).map((aits) => ({
        ...aits,
        type: "aits",
        examId: exam._id,
        subjects: [],
        tests: aits.tests || [],
      }))
    )
  );

  // Access is purely per-topic: fetch the user's valid (non-disabled,
  // non-expired) unlocks across every paid series/AITS, with their expiry.
  const paidIds = [
    ...topics.filter((t) => t.isPaid).map((t) => t._id),
    ...flatAitsSections.filter((a) => a.isPaid).map((a) => a._id),
  ];
  // Fetch ALL access docs (including lapsed/revoked) so we can tell a series
  // that was never bought ("locked") from one that was bought and expired,
  // letting the UI show a dedicated renew screen for the latter.
  const accessDocs = paidIds.length
    ? await TopicAccess.find({ userId, topicId: { $in: paidIds } })
        .select("topicId expiresAt disabled")
        .lean()
    : [];
  const accessByTopic = new Map(); // valid unlocks → expiry
  const lapsedTopics = new Map();  // had a record but now expired/disabled → expiry
  for (const a of accessDocs) {
    const id = a.topicId.toString();
    const valid = !a.disabled && (!a.expiresAt || new Date(a.expiresAt) > now);
    if (valid) accessByTopic.set(id, a.expiresAt || null);
    else lapsedTopics.set(id, a.expiresAt || null);
  }

  const isUnlocked = (t) => !t.isPaid || accessByTopic.has(t._id?.toString());
  const expiryOf = (t) =>
    accessByTopic.get(t._id?.toString()) ?? lapsedTopics.get(t._id?.toString()) ?? null;
  const isExpired = (t) =>
    t.isPaid && !accessByTopic.has(t._id?.toString()) && lapsedTopics.has(t._id?.toString());
  const annotate = (t) => ({
    ...t,
    isUnlocked: isUnlocked(t),
    accessExpiresAt: expiryOf(t),
    accessExpired: isExpired(t),
  });

  const annotateTopicsInHierarchy = (cat) => ({
    ...cat,
    exams: (cat.exams || []).map((exam) => ({
      ...exam,
      testSeries: (exam.testSeries || []).map(annotate),
    })),
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    topics: [...topics.map(annotate), ...flatAitsSections.map(annotate)],
    categories: categories.map(annotateTopicsInHierarchy),
  });
});





