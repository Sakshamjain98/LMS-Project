import * as service from "./teacher.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { activityQueue } from "../../infrastucture/queues/activity.queue.js";
import { testPublishQueue } from "../../infrastucture/queues/testPublish.queue.js";
import Course from "../../models/course.model.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const dashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboardData(req.user._id);
  await activityQueue.add("teacher_dashboard_view", {
    userId: req.user._id,
    role: req.user.role,
    action: "TEACHER_DASHBOARD_VIEW",
  });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    ...data,
  });
});

export const profile = asyncHandler(async (req, res) => {
  const user = await service.getProfile(req.user._id);
  await activityQueue.add("teacher_profile_view", { userId: req.user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await service.updateProfile(req.user._id, req.body);
  await activityQueue.add("teacher_profile_update", { userId: user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PROFILE_UPDATED,
    user,
  });
});

export const createCourse = asyncHandler(async (req, res) => {
  try {
    const { title, description, isPaid, tags, price } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];
    const notesFiles = req.files?.notes || [];

    if (!thumbnailFile) {
      return res.status(400).json({ success: false, message: "Thumbnail image is required" });
    }

    console.log("Thumbnail:", thumbnailFile.path, thumbnailFile.filename);
    notesFiles.forEach((f, i) => console.log(`Note ${i}:`, f.path, f.filename));

    const course = await Course.create({
      title,
      description,
      isPaid: isPaid === "true" || isPaid === true,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      price: Number(price) || 0,
      educator: req.user._id,
      thumbnail: {
        url: thumbnailFile.path,
        publicId: thumbnailFile.filename,
        fileType: "image",
      },
      notes: notesFiles.map((file) => ({
        url: file.path,
        publicId: file.filename,
        fileType: "pdf",
      })),
    });

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("🔥 createCourse error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const myCourses = asyncHandler(async (req, res) => {
  const courses = await service.getMyCourses(req.user._id);
  await activityQueue.add("my_courses_view", { userId: req.user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    courses,
  });
});

export const studentPerformance = asyncHandler(async (req, res) => {
  await activityQueue.add("student_performance_view", { userId: req.user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    performance: [],
  });
});

export const listTests = asyncHandler(async (req, res) => {
  const tests = await service.getTeacherTests(req.user._id);
  res.json({ success: true, tests });
});

export const createTest = asyncHandler(async (req, res) => {
  const test = await service.createTest(req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, test });
});

export const addQuestions = asyncHandler(async (req, res) => {
  const test = await service.addQuestions(req.params.id, req.body.questionIds);
  res.json({ success: true, test });
});

export const saveConfig = asyncHandler(async (req, res) => {
  const config = await service.saveTestConfig({
    testId: req.params.id,
    ...req.body,
  });
  res.json({ success: true, config });
});

export const previewTest = asyncHandler(async (req, res) => {
  const test = await service.getTeacherTests(req.user._id);
  res.json({ success: true, preview: test });
});

export const publishTest = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;
  const testId = req.params.id;
  let status = "published";

  if (startTime && new Date(startTime) > new Date()) {
    status = "scheduled";
    await testPublishQueue.add(
      { testId },
      { delay: new Date(startTime).getTime() - Date.now() }
    );
  }

  const test = await service.publishTest(testId, { status, startTime, endTime });
  res.json({
    success: true,
    message: status === "scheduled" ? "Test scheduled successfully" : "Test published successfully",
    test,
  });
});

export const analytics = asyncHandler(async (req, res) => {
  const analyticsData = await service.getTestAnalytics(req.params.id);
  res.json({ success: true, ...analyticsData });
});