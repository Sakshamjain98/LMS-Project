import express from "express";
import * as controller from "./admin.controller.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorize("admin"));

// Existing routes
router.post("/create", controller.createAdmin);
router.get("/admins", controller.getAdmins);
router.put("/admins/:id", controller.updateAdmin);
router.delete("/admins/:id", controller.deleteAdmin);
router.get("/profile", controller.getAdminProfile);
router.put("/profile", controller.updateAdminProfile);
router.put("/change-password", controller.changeAdminPassword);
router.get("/dashboard", controller.dashboard);
router.get("/users", controller.users);
router.put("/users/:id/role", controller.updateRole);
router.delete("/users/:id", controller.removeUser);
router.get("/content/pending", controller.pendingContent);
router.put("/content/course/:id/approve", controller.approveCourse);
router.delete("/content/course/:id/reject", controller.rejectCourse); // now soft reject
router.get("/payments", controller.payments);
router.put("/payments/:id/refund", controller.refund);
router.post("/cms/blog", controller.createBlog);
router.put("/cms/blog/:id", controller.updateBlog);
router.delete("/cms/blog/:id", controller.deleteBlog);
router.get("/blogs", controller.getBlogs);
router.get("/teachers/pending", controller.pendingTeachers);
router.put("/teachers/:id/approve", controller.approveTeacher);

// -------------------- News Management --------------------
router.post("/news", controller.createNews);
router.put("/news/:id", controller.updateNews);
router.delete("/news/:id", controller.deleteNews);
router.get("/news", controller.getAllNews);
router.get("/news/:id", controller.getNewsById);

// -------------------- Comment Moderation --------------------
router.get("/comments/pending", controller.getPendingComments);
router.put("/comments/:id/approve", controller.approveComment);
router.delete("/comments/:id", controller.deleteComment);
router.get("/comments", controller.getAllComments);

// -------------------- Subscription Plans --------------------
router.post("/plans", controller.createPlan);
router.put("/plans/:id", controller.updatePlan);
router.delete("/plans/:id", controller.deletePlan);
router.get("/plans", controller.getAllPlans);

// -------------------- Detailed Analytics --------------------
router.get("/analytics/revenue", controller.getRevenueAnalytics);
router.get("/analytics/users", controller.getUserAnalytics);
router.get("/analytics/tests", controller.getTestAnalytics);
router.get("/analytics/courses", controller.getCourseAnalytics);

// -------------------- Teacher Feature Settings --------------------
router.get("/settings/teacher", controller.getTeacherSettings);
router.put("/settings/teacher", controller.updateTeacherSettings);

export default router;