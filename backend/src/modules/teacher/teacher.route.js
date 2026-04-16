import express from "express";
import * as controller from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import * as analyticsController from "../analytics/analytics.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("teacher"));

// ========== DASHBOARD & PROFILE ==========
router.get("/dashboard", controller.dashboard);
router.get("/ui-settings", controller.getUiSettings);
router.get("/profile", controller.profile);
router.put("/profile", controller.updateUserProfile);

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
  // Allow both teacher and student roles
  if (!["teacher", "student"].includes(req.user.role)) {
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

// ========== PERFORMANCE ==========
router.get("/performance", controller.studentPerformance);

router.post(
  "/tests/upload-csv",
  upload.single("file"), // Middleware to handle file uploads
  controller.createTestFromCSV
);

export default router;