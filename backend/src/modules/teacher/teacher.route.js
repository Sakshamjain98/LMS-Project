import express from "express";
import * as controller from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { requirePermission } from "../../middlewares/requirePermission.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import * as analyticsController from "../analytics/analytics.controller.js";
import * as testSeriesController from "../testSeries/testSeries.controller.js";
import examCategoryRoutes from "../examCategory/examCategory.routes.js";
import examRoutes from "../exam/exam.routes.js";
import aitsRoutes from "../aits/aits.routes.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("teacher", "admin"));

// ========== DASHBOARD & PROFILE ==========
router.get("/dashboard", controller.dashboard);
router.get("/ui-settings", controller.getUiSettings);
router.get("/profile", controller.profile);
router.put("/profile", upload.single("avatar"), controller.updateUserProfile);

// ========== COURSES ==========
router.post(
  "/courses",
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  controller.createCourseController
);

router.get("/courses", controller.myCourses);
router.get("/courses/:id", controller.getCourse);

router.put(
  "/courses/:id",
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  controller.updateCourseController
);

router.delete("/courses/:id", controller.deleteCourseController);

// ========== COURSE SECTIONS ==========
router.post(
  "/courses/:courseId/sections",
  controller.addSectionController
);

router.put(
  "/courses/:courseId/sections/:sectionId",
  controller.updateSectionController
);

router.delete(
  "/courses/:courseId/sections/:sectionId",
  controller.deleteSectionController
);

// ========== VIDEOS ==========
router.post(
  "/courses/:courseId/sections/:sectionId/videos",
  controller.addVideo
);

router.put(
  "/courses/:courseId/sections/:sectionId/videos/:videoIndex",
  controller.updateVideo
);

router.delete(
  "/courses/:courseId/sections/:sectionId/videos/:videoIndex",
  controller.removeVideo
);

// ========== NOTES ==========
router.post(
  "/courses/:courseId/sections/:sectionId/notes",
  upload.fields([{ name: "notes", maxCount: 10 }]),
  controller.uploadSectionNotes
);

router.post(
  "/notes",
  upload.fields([{ name: "file", maxCount: 1 }]),
  controller.createNote
);

router.get("/notes", controller.getTeacherNotes);
router.get("/notes/:id", controller.getNoteById);

router.put(
  "/notes/:id",
  upload.fields([{ name: "file", maxCount: 1 }]),
  controller.updateNote
);

router.delete("/notes/:id", controller.deleteNote);

// ========== TESTS ==========
router.get("/tests", (req, res, next) => {
  // Allow teacher/admin to use the full tests module.
  if (!["teacher", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource"
    });
  }
  next();
}, controller.listTests);

router.post("/tests", controller.createTestController);
router.get("/tests/:id", controller.getTest);
router.put("/tests/:id", controller.updateTest);
router.delete("/tests/:id", controller.deleteTest);

// ========== TEST CONFIG ==========
router.post("/tests/:id/config", controller.saveConfig);

// ========== PUBLISH ==========
router.post("/tests/:id/publish", controller.publishTestController);

// ========== PREVIEW ==========
router.get("/tests/:id/preview", controller.previewTest);

// ========== ANALYTICS ==========
router.get(
  "/tests/:testId/analytics",
  analyticsController.getTestAnalytics
);

router.get(
  "/tests/:testId/questions/:questionId/analytics",
  analyticsController.getQuestionAnalytics
);

// ========== EXAM CATEGORIES / EXAMS / AITS ==========
router.use("/exam-categories", examCategoryRoutes);
router.use("/exams", examRoutes);
router.use("/aits", aitsRoutes);

// ========== TEST SERIES ==========
router.get("/test-series", testSeriesController.getSeriesTree);
// Full hierarchy (categories → exams → series → subjects → chapters → tests + AITS)
router.get("/test-series/hierarchy", testSeriesController.getFullHierarchy);
router.post("/test-series/topics", requirePermission("testseries.create"), testSeriesController.createTopic);
router.put("/test-series/topics/:topicId", requirePermission("testseries.edit"), testSeriesController.updateTopic);
router.delete("/test-series/topics/:topicId", requirePermission("testseries.edit"), testSeriesController.deleteTopic);

router.post("/test-series/topics/:topicId/subjects", requirePermission("testseries.create"), testSeriesController.createSubject);
router.put("/test-series/subjects/:subjectId", requirePermission("testseries.edit"), testSeriesController.updateSubject);
router.delete("/test-series/subjects/:subjectId", requirePermission("testseries.edit"), testSeriesController.deleteSubject);

router.post("/test-series/subjects/:subjectId/chapters", requirePermission("chapters.edit"), testSeriesController.createChapter);
router.put("/test-series/chapters/:chapterId", requirePermission("chapters.edit"), testSeriesController.updateChapter);
router.delete("/test-series/chapters/:chapterId", requirePermission("chapters.edit"), testSeriesController.deleteChapter);

router.post("/test-series/chapters/:chapterId/tests", requirePermission("chapters.edit"), testSeriesController.createTestInChapter);
router.get("/test-series/topics/:topicId/analytics", testSeriesController.getTopicAnalytics);

// Assign a test series (topic) to an exam
router.patch("/test-series/topics/:topicId/assign-exam", requirePermission("testseries.edit"), testSeriesController.assignTopicToExam);

// ========== PERFORMANCE ==========
router.get("/performance", controller.studentPerformance);

router.post(
  "/tests/upload-csv",
  upload.single("file"), // Middleware to handle file uploads
  controller.createTestFromCSV
);

router.post(
  "/tests/upload-question-image",
  upload.single("image"),
  controller.uploadQuestionImage
);

export default router;