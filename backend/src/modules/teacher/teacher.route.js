import express from "express";
import * as controller from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorize("teacher"));

// Dashboard & Profile (unchanged)
router.get("/dashboard", controller.dashboard);
router.get("/profile", controller.profile);
router.put("/profile", controller.updateProfile);

// Courses (unchanged, already section-based)
router.post("/courses", upload.fields([{ name: "thumbnail", maxCount: 1 }]), controller.createCourse);
router.get("/courses", controller.myCourses);
router.get("/courses/:id", controller.getCourse);
router.put("/courses/:id", upload.fields([{ name: "thumbnail", maxCount: 1 }]), controller.updateCourse);
router.delete("/courses/:id", controller.deleteCourse);

// Course Sections (unchanged)
router.post("/courses/:courseId/sections", controller.addSection);
router.put("/courses/:courseId/sections/:sectionId", controller.updateSection);
router.delete("/courses/:courseId/sections/:sectionId", controller.deleteSection);
router.post("/courses/:courseId/sections/:sectionId/notes", upload.fields([{ name: "notes", maxCount: 10 }]), controller.uploadSectionNotes);
router.post("/courses/:courseId/sections/:sectionId/videos", controller.addVideoLink);
router.delete("/courses/:courseId/sections/:sectionId/videos/:videoIndex", controller.removeVideoLink);

// ==================== TEST MANAGEMENT ====================
router.get("/tests", controller.listTests);
router.post("/tests", controller.createTest);
router.get("/tests/:id", controller.getTest);                // 👈 NEW: get single test with questions
router.post("/tests/:id/questions", controller.addQuestion); // 👈 NEW: create & add question to test
router.post("/tests/:id/questions/bulk", controller.bulkAddQuestions); // optional bulk
router.post("/tests/:id/config", controller.saveConfig);
router.get("/tests/:id/preview", controller.previewTest);
router.post("/tests/:id/publish", controller.publishTest);
router.get("/tests/:id/analytics", controller.analytics);
router.get("/tests/:id/questions/:questionId/analytics", controller.questionAnalytics); // per question

// Student Performance (placeholder)
router.get("/students/performance", controller.studentPerformance);

export default router;