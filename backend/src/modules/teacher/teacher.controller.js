import * as service from "./teacher.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { activityQueue } from "../../infrastucture/queues/activity.queue.js";
import { testPublishQueue } from "../../infrastucture/queues/testPublish.queue.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

// ==================== Dashboard & Profile ====================
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

// ==================== Course CRUD ====================
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, isPaid, tags, price } = req.body;
  const thumbnailFile = req.files?.thumbnail?.[0];
  if (!thumbnailFile) {
    return res.status(400).json({ error: "Thumbnail image is required" });
  }

  const courseData = {
    title,
    description,
    isPaid: isPaid === "true" || isPaid === true,
    tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    price: Number(price) || 0,
    thumbnail: {
      url: thumbnailFile.path,
      publicId: thumbnailFile.filename,
      fileType: "image",
    },
  };

  const course = await service.createCourse(courseData, req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Course created successfully",
    course,
  });
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

export const getCourse = asyncHandler(async (req, res) => {
  const course = await service.getCourseById(req.params.id, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    course,
  });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { title, description, isPaid, tags, price } = req.body;
  const thumbnailFile = req.files?.thumbnail?.[0];

  const updateData = {
    title,
    description,
    isPaid: isPaid === "true" || isPaid === true,
    tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    price: Number(price) || 0,
  };

  if (thumbnailFile) {
    updateData.thumbnail = {
      url: thumbnailFile.path,
      publicId: thumbnailFile.filename,
      fileType: "image",
    };
  }

  const course = await service.updateCourse(req.params.id, req.user._id, updateData);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Course updated successfully",
    course,
  });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  await service.deleteCourse(req.params.id, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Course deleted successfully",
  });
});

// ==================== Sections ====================
export const addSection = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;
  const course = await service.addSection(courseId, req.user._id, { title, description });
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Section added",
    section: course.sections[course.sections.length - 1],
  });
});

export const updateSection = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const updates = req.body;
  const section = await service.updateSection(courseId, req.user._id, sectionId, updates);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Section updated",
    section,
  });
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  await service.deleteSection(courseId, req.user._id, sectionId);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Section deleted",
  });
});

// ==================== Notes (PDF) Upload ====================
export const uploadSectionNotes = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const notesFiles = req.files?.notes || [];
  if (notesFiles.length === 0) {
    return res.status(400).json({ error: "No notes files uploaded" });
  }

  const notes = notesFiles.map((file) => ({
    url: file.path,
    publicId: file.filename,
    fileType: "pdf",
  }));

  const updatedSection = await service.addNotesToSection(
    courseId,
    req.user._id,
    sectionId,
    notes
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Notes uploaded successfully",
    notes: updatedSection.notes,
  });
});

// ==================== Video Links ====================
export const addVideoLink = asyncHandler(async (req, res) => {
  const { courseId, sectionId } = req.params;
  const { url, title } = req.body;
  if (!url || !title) {
    return res.status(400).json({ error: "URL and title are required" });
  }

  const updatedSection = await service.addVideoLink(
    courseId,
    req.user._id,
    sectionId,
    { url, title }
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Video link added",
    videos: updatedSection.videos,
  });
});

export const removeVideoLink = asyncHandler(async (req, res) => {
  const { courseId, sectionId, videoIndex } = req.params;
  const idx = parseInt(videoIndex);
  if (isNaN(idx)) {
    return res.status(400).json({ error: "Invalid video index" });
  }

  const updatedSection = await service.removeVideoLink(
    courseId,
    req.user._id,
    sectionId,
    idx
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Video link removed",
    videos: updatedSection.videos,
  });
});

// ==================== Student Performance (placeholder) ====================
export const studentPerformance = asyncHandler(async (req, res) => {
  await activityQueue.add("student_performance_view", { userId: req.user._id });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.SUCCESS,
    performance: [],
  });
});

// ==================== Tests (existing) ====================
export const listTests = asyncHandler(async (req, res) => {
  const tests = await service.getTeacherTests(req.user._id);
  res.json({ success: true, tests });
});

export const createTest = asyncHandler(async (req, res) => {
  const test = await service.createTest(req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, test });
});

export const getTest = asyncHandler(async (req, res) => {
  const test = await service.getTestById(req.params.id, req.user._id);
  res.json({ success: true, test });
});

export const addQuestion = asyncHandler(async (req, res) => {
  const questionData = { ...req.body, createdBy: req.user._id, testId: req.params.id };
  const question = await service.createQuestion(questionData);
  // Automatically link question to test
  await service.linkQuestionToTest(req.params.id, question._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, question });
});

export const bulkAddQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body; // array of question objects
  const testId = req.params.id;
  const created = await service.bulkCreateQuestions(questions, testId, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, count: created.length, questions: created });
});

export const saveConfig = asyncHandler(async (req, res) => {
  const config = await service.saveTestConfig({
    testId: req.params.id,
    ...req.body,
  });
  res.json({ success: true, config });
});

export const previewTest = asyncHandler(async (req, res) => {
  // Return test with populated questions
  const test = await service.getTestWithQuestions(req.params.id, req.user._id);
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

export const questionAnalytics = asyncHandler(async (req, res) => {
  const data = await service.getQuestionAnalytics(req.params.questionId);
  res.json({ success: true, analytics: data });
});

// ... (studentPerformance remains unchanged)