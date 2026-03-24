// controllers/teacher.controller.js

import {
  getDashboardData,
  getProfile,
  updateProfile,
  createCourse,
  getMyCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addSection,
  updateSection,
  deleteSection,
  addNotesToSection,
  addVideoLink,
  removeVideoLink,
  updateVideoLink,
} from "../teacher/teacher.service.js";

import * as testService from "../test/test.service.js";
import * as noteService from "../teacher/note.service.js";

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { ApiError } from "../../shared/error/ApiError.js";


// ================= DASHBOARD =================
export const dashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardData(req.user._id);

  res.json({
    success: true,
    data: stats,
  });
});


// ================= PROFILE =================
export const profile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.user._id);

  res.json({
    success: true,
    user,
  });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const updated = await updateProfile(req.user._id, req.body);

  res.json({
    success: true,
    message: "Profile updated",
    user: updated,
  });
});


// ================= COURSES =================
export const createCourseController = asyncHandler(async (req, res) => {
  const thumbnailPath = req.files?.thumbnail?.[0]?.path || null;

  // Build thumbnail object with proper structure
  const thumbnailData = thumbnailPath
    ? {
        url: thumbnailPath,
        publicId: req.files.thumbnail[0].filename || `thumb_${Date.now()}`,
        fileType: "image",
      }
    : null;

  const course = await createCourse(
    {
      ...req.body,
      thumbnail: thumbnailData,
    },
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Course created successfully",
    course,
  });
});

export const myCourses = asyncHandler(async (req, res) => {
  const courses = await getMyCourses(req.user._id);

  res.json({
    success: true,
    courses,
  });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.id, req.user._id);

  res.json({
    success: true,
    course,
  });
});

export const updateCourseController = asyncHandler(async (req, res) => {
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;

  // Build thumbnail object only if new file is provided
  const updateData = { ...req.body };
  if (thumbnailPath) {
    updateData.thumbnail = {
      url: thumbnailPath,
      publicId: req.files.thumbnail[0].filename || `thumb_${Date.now()}`,
      fileType: "image",
    };
  }

  const course = await updateCourse(
    req.params.id,
    req.user._id,
    updateData
  );

  res.json({
    success: true,
    message: "Course updated",
    course,
  });
});

export const deleteCourseController = asyncHandler(async (req, res) => {
  await deleteCourse(req.params.id, req.user._id);

  res.json({
    success: true,
    message: "Course deleted",
  });
});

// ================= SECTIONS =================
export const addSectionController = asyncHandler(async (req, res) => {
  const course = await addSection(
    req.params.courseId,
    req.user._id,
    req.body
  );

  // Get the last added section
  const section = course.sections[course.sections.length - 1];

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Section added",
    section,
    course, // Include full course for reference
  });
});

export const updateSectionController = asyncHandler(async (req, res) => {
  const section = await updateSection(
    req.params.courseId,
    req.user._id,
    req.params.sectionId,
    req.body
  );

  res.json({
    success: true,
    message: "Section updated",
    section,
  });
});

export const deleteSectionController = asyncHandler(async (req, res) => {
  await deleteSection(
    req.params.courseId,
    req.user._id,
    req.params.sectionId
  );

  res.json({
    success: true,
    message: "Section deleted",
  });
});


// ================= NOTES IN SECTION =================
export const uploadSectionNotes = asyncHandler(async (req, res) => {
  const files = req.files?.notes || [];

  const notes = await addNotesToSection(
    req.params.courseId,
    req.user._id,
    req.params.sectionId,
    files
  );

  res.json({
    success: true,
    message: "Notes uploaded",
    notes,
  });
});


// ================= VIDEOS =================
export const addVideo = asyncHandler(async (req, res) => {
  const videos = await addVideoLink(
    req.params.courseId,
    req.user._id,
    req.params.sectionId,
    req.body
  );

  res.json({
    success: true,
    message: "Video added",
    videos,
  });
});

export const removeVideo = asyncHandler(async (req, res) => {
  const videos = await removeVideoLink(
    req.params.courseId,
    req.user._id,
    req.params.sectionId,
    parseInt(req.params.videoIndex)
  );

  res.json({
    success: true,
    message: "Video removed",
    videos,
  });
});

export const updateVideo = asyncHandler(async (req, res) => {
  const videos = await updateVideoLink(
    req.params.courseId,
    req.user._id,
    req.params.sectionId,
    parseInt(req.params.videoIndex),
    req.body
  );

  res.json({
    success: true,
    message: "Video updated",
    videos,
  });
});

// ================= NOTES (SEPARATE MODULE) =================
export const createNote = asyncHandler(async (req, res) => {
  const { title, description, isFree, tags } = req.body;
  const file = req.files?.file?.[0];

  if (!file) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Note file is required");
  }

  if (!title || !title.trim()) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title is required");
  }

  const noteData = {
    title: title.trim(),
    description: description ? description.trim() : "",
    isFree: isFree === "true" || isFree === true,
    tags: tags ? (typeof tags === "string" ? tags.split(",").map(t => t.trim()) : tags) : [],
    file: {
      url: file.path,
      publicId: file.filename,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "other",
    },
  };

  const note = await noteService.createNote(noteData, req.user._id);

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Note created successfully",
    note,
  });
});

export const getTeacherNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.getNotesByTeacher(req.user._id);

  res.json({
    success: true,
    notes,
  });
});

export const getNoteById = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.params.id, req.user._id);

  res.json({
    success: true,
    note,
  });
});

export const updateNote = asyncHandler(async (req, res) => {
  const { title, description, isFree, tags } = req.body;
  const file = req.files?.file?.[0];

  const updateData = {};
  
  if (title) updateData.title = title.trim();
  if (description) updateData.description = description.trim();
  if (isFree !== undefined) updateData.isFree = isFree === "true" || isFree === true;
  if (tags) updateData.tags = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : tags;

  if (file) {
    updateData.file = {
      url: file.path,
      publicId: file.filename,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "other",
    };
  }

  const note = await noteService.updateNote(req.params.id, req.user._id, updateData);

  res.json({
    success: true,
    message: "Note updated successfully",
    note,
  });
});

export const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(req.params.id, req.user._id);

  res.json({
    success: true,
    message: "Note deleted successfully",
  });
});


// ================= TESTS =================
export const listTests = asyncHandler(async (req, res) => {
  const tests = await testService.getTeacherTests(req.user._id);

  res.json({
    success: true,
    tests,
  });
});

export const createTestController = asyncHandler(async (req, res) => {
  const test = await testService.createTest(req.body, req.user._id);

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Test created successfully",
    data: { test },
  });
});

export const getTest = asyncHandler(async (req, res) => {
  const test = await testService.getTestById(req.params.id, req.user._id);

  res.json({
    success: true,
    test,
  });
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await testService.updateTest(
    req.params.id,
    req.body,
    req.user._id
  );

  res.json({
    success: true,
    message: "Test updated",
    test,
  });
});

export const deleteTest = asyncHandler(async (req, res) => {
  await testService.deleteTest(req.params.id, req.user._id);

  res.json({
    success: true,
    message: "Test deleted",
  });
});


// ================= CONFIG =================
export const saveConfig = asyncHandler(async (req, res) => {
  const body = req.body;

  if (!body.duration || body.duration <= 0) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Duration must be > 0");
  }

  const test = await testService.saveTestConfig(
    req.params.id,
    body,
    req.user._id
  );

  res.json({
    success: true,
    message: "Config saved",
    test,
  });
});


// ================= PUBLISH =================
export const publishTestController = asyncHandler(async (req, res) => {
  const { startTime = null, endTime = null } = req.body;

  if (startTime && isNaN(new Date(startTime))) {
    throw new ApiError(400, "Invalid startTime");
  }

  if (endTime && isNaN(new Date(endTime))) {
    throw new ApiError(400, "Invalid endTime");
  }

  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, "Start must be before end");
  }

  const test = await testService.publishTest(
    req.params.id,
    { startTime, endTime },
    req.user._id
  );

  res.json({
    success: true,
    message: `Test ${test.status}`,
    test,
  });
});


// ================= PREVIEW =================
export const previewTest = asyncHandler(async (req, res) => {
  const test = await testService.getTestWithQuestions(
    req.params.id,
    req.user._id
  );

  res.json({
    success: true,
    test,
  });
});


// ================= ANALYTICS =================
export const studentPerformance = asyncHandler(async (req, res) => {
  const stats = await testService.getTeacherAnalytics(
    req.user._id,
    req.body
  );

  res.json({
    success: true,
    data: stats,
  });
});