// controllers/teacher.controller.js

import {
  getDashboardData,
  getTeacherUiSettings,
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
  createTest, bulkCreateQuestions
} from "../teacher/teacher.service.js";
import csv from "csv-parser"
import { Readable } from "stream";

import * as testService from "../test/test.service.js";
import * as noteService from "../teacher/note.service.js";
import * as aitsService from "../aits/aits.service.js";

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

export const getUiSettings = asyncHandler(async (req, res) => {
  const settings = await getTeacherUiSettings();

  res.json({
    success: true,
    settings,
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
  const payload = { ...req.body };
  if (req.file?.path) {
    payload.avatar = req.file.path;
  }

  const updated = await updateProfile(req.user._id, payload);

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
  const result = await testService.getTeacherTests(req.user._id, req.query);

  res.json({
    success: true,
    ...result,
  });
});

export const createTestController = asyncHandler(async (req, res) => {
  const { startTime = null, endTime = null } = req.body || {};

  if (!req.body?.chapterId) {
    throw new ApiError(400, "chapterId is required to create a test");
  }

  if (startTime && isNaN(new Date(startTime))) {
    throw new ApiError(400, "Invalid startTime");
  }

  if (endTime && isNaN(new Date(endTime))) {
    throw new ApiError(400, "Invalid endTime");
  }

  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, "Start must be before end");
  }

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
  const { startTime = null, endTime = null, unpublish = false } = req.body || {};

  // Unpublish → back to draft (hides it from students again).
  if (unpublish) {
    const test = await testService.setTestStatus(req.params.id, "draft", req.user._id);
    return res.json({ success: true, message: "Test moved to draft", test });
  }

  // Open tests have no schedule, so they publish immediately. endTime is only
  // validated when an actual schedule window is supplied.
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


// src/modules/teacher/teacher.controller.js



export const createTestFromCSV = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "No CSV file uploaded");
    const isAitsUpload = Boolean(req.body?.aitsId);
    if (!isAitsUpload && !req.body?.chapterId) {
      throw new ApiError(400, "Either chapterId or aitsId is required for CSV test upload");
    }

    const parsedQuestions = [];
    let parseError = null;  // use a flag instead of stream.destroy() to avoid unhandled errors

    const response = await fetch(req.file.path);
    if (!response.ok || !response.body) {
      throw new ApiError(400, "Unable to fetch uploaded CSV file.");
    }
    const csvStream = Readable.fromWeb(response.body);

    // Core required headers, while other fields are optional.
    const requiredHeaders = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'answer'];

    const parseCorrectOptionIndex = (answerValue, options) => {
      const raw = (answerValue || "").toString().trim();

      // Accept 1-based numeric values (1-4)
      const numeric = Number(raw);
      if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
        return numeric - 1;
      }

      // Accept letters (A-D)
      const upper = raw.toUpperCase();
      const letterIndex = ["A", "B", "C", "D"].indexOf(upper);
      if (letterIndex >= 0 && letterIndex < options.length) {
        return letterIndex;
      }

      // Accept exact option text
      const textIndex = options.findIndex((opt) => opt.text.toLowerCase() === raw.toLowerCase());
      if (textIndex >= 0) {
        return textIndex;
      }

      return -1;
    };

    csvStream
      .pipe(csv())
      .on('data', (row) => {
        if (parseError) return; // skip remaining rows once an error is found

        const normalized = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k.trim(), typeof v === 'string' ? v.trim() : v])
        );

        const isValid = requiredHeaders.every(field =>
          Object.prototype.hasOwnProperty.call(normalized, field) && normalized[field] !== ""
        );

        if (!isValid) {
          parseError = "Invalid CSV format. Please ensure all columns (question, optionA, optionB, optionC, optionD, answer) are present and not empty.";
          return;
        }

        const options = [
          { text: normalized.optionA, isCorrect: false },
          { text: normalized.optionB, isCorrect: false },
          { text: normalized.optionC, isCorrect: false },
          { text: normalized.optionD, isCorrect: false },
        ];

        const correctOptionIndex = parseCorrectOptionIndex(normalized.answer, options);

        if (correctOptionIndex < 0) {
          parseError = `Invalid answer value '${normalized.answer}'. Use 1–4, A–D, or the exact option text.`;
          return;
        }

        options[correctOptionIndex].isCorrect = true;

        const marks = Number(normalized.marks);
        const negativeMarks = Number(normalized.negativeMarks);
        const difficulty = ["easy", "medium", "hard"].includes((normalized.difficulty || "").toLowerCase())
          ? normalized.difficulty.toLowerCase()
          : "medium";

        parsedQuestions.push({
          questionText: normalized.question,
          imageUrl: normalized.imageUrl || "",
          questionType: "MCQ",
          options,
          correctOptionIndex,
          marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
          negativeMarks: Number.isFinite(negativeMarks) && negativeMarks >= 0 ? negativeMarks : 0,
          difficulty,
          explanation: normalized.explanation || "",
          tags: (normalized.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        });
      })
      .on('end', async () => {
        if (parseError) {
          return res.status(400).json({ success: false, message: parseError });
        }
        if (parsedQuestions.length === 0) {
          return res.status(400).json({ success: false, message: "CSV file is empty or has no valid rows." });
        }

        const now = new Date();
        now.setSeconds(0, 0);
        const startTimeRaw = req.body.startTime;
        const endTimeRaw = req.body.endTime;

        const isOpenTest = req.body.isOpenTest === "true" || req.body.isOpenTest === true;

        // If test is open, skip schedule validation entirely.
        if (!isOpenTest && !endTimeRaw) {
          return res.status(400).json({
            success: false,
            message: "endTime is required for scheduled tests.",
          });
        }

        let startTime;
        let endTime;
        if (!isOpenTest) {
          if (startTimeRaw) {
            startTime = new Date(startTimeRaw);
            if (Number.isNaN(startTime.getTime())) {
              return res.status(400).json({ success: false, message: "Invalid startTime." });
            }
          } else {
            // If teacher didn't provide a startTime, default to now (rounded to minute)
            startTime = new Date(now);
          }

          endTime = new Date(endTimeRaw);
          if (Number.isNaN(endTime.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid endTime." });
          }

          const graceMs = 60 * 1000;
          // If teacher provided a startTime, ensure it is not backdated. Always ensure endTime is not backdated.
          if (startTimeRaw && startTime.getTime() < now.getTime() - graceMs) {
            return res.status(400).json({
              success: false,
              message: "Start date/time cannot be backdated.",
            });
          }

          if (endTime.getTime() < now.getTime() - graceMs) {
            return res.status(400).json({
              success: false,
              message: "End date/time cannot be backdated.",
            });
          }

          if (startTime >= endTime) {
            return res.status(400).json({
              success: false,
              message: "Start time must be before end time.",
            });
          }
        }

        const normalizeTestType = (rawType) => {
          const normalized = String(rawType || "").trim().toLowerCase();
          if (normalized === "aits") return "aits";
          if (["pyq", "previous_year", "previous-year", "previousyear"].includes(normalized)) {
            return "pyq";
          }
          return "practice";
        };

        const basePayload = {
          title: (req.body.title || "CSV Imported Test").toString().trim() || "CSV Imported Test",
          description: (req.body.description || "").toString().trim(),
          duration: Number(req.body.duration) > 0 ? Number(req.body.duration) : 60,
          passingMarks: Number(req.body.passingMarks) >= 0 ? Number(req.body.passingMarks) : 0,
          startTime: startTime ? startTime.toISOString() : undefined,
          endTime: endTime ? endTime.toISOString() : undefined,
          isPaid: req.body.isPaid === "true" || req.body.isPaid === true,
          attemptLimit: Number.isFinite(Number(req.body.attemptLimit)) ? Number(req.body.attemptLimit) : 0,
          isProctored: req.body.isProctored === "true" || req.body.isProctored === true,
          type: normalizeTestType(req.body.type),
        };

        let createdTest;
        if (isAitsUpload) {
          createdTest = await aitsService.createAITSTest(req.body.aitsId, { ...basePayload, type: "aits" }, req.user._id);
        } else {
          createdTest = await createTest({ ...basePayload, chapterId: req.body.chapterId }, req.user._id);
        }
        const createdQuestions = await bulkCreateQuestions(parsedQuestions, createdTest._id, req.user._id);

        res.status(200).json({ 
          success: true, 
          message: `Successfully created '${createdTest.title}' with ${createdQuestions.length} questions.`,
          data: {
            testId: createdTest._id,
            questionsImported: createdQuestions.length,
          },
        });
      })
      .on('error', (err) => {
        console.error("CSV Processing Error:", err.message);
        res.status(400).json({ success: false, message: err.message });
      });

  } catch (error) {
    next(error);
  }
};

export const uploadQuestionImage = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ success: false, message: "No image uploaded" });
  }
  res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename,
  });
});
