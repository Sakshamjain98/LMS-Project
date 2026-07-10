import express from "express";
import * as controller from "./admin.controller.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requirePermission } from "../../middlewares/requirePermission.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorize("admin", "superadmin"));

// -------------------- Admin Creation / Management (superadmin only) --------------------
router.post("/create", authorize("superadmin"), controller.createAdmin);
router.get("/admins", authorize("superadmin"), controller.getAdmins);
router.put("/admins/:id", authorize("superadmin"), controller.updateAdmin);
router.delete("/admins/:id", authorize("superadmin"), controller.deleteAdmin);
router.patch("/admins/:id/reset-password", authorize("superadmin"), controller.resetAdminPassword);
router.get("/profile", controller.getAdminProfile);
router.put("/profile", controller.updateAdminProfile);
router.put("/change-password", controller.changeAdminPassword);
router.get("/dashboard", controller.dashboard);
router.get("/users", requirePermission("users.view"), controller.users);
router.get("/users/export", requirePermission("users.view"), controller.exportUsers);
router.put("/users/:id/role", authorize("superadmin"), controller.updateRole);
router.get("/users/:id/subscription", requirePermission("users.view"), controller.userSubscription);
router.post("/users/:id/subscription/disable", requirePermission("users.suspend"), controller.disableUserAccess);
router.post("/users/:id/subscription/enable", requirePermission("users.edit"), controller.enableUserAccess);
router.post("/users/:id/subscription/extend", requirePermission("users.edit"), controller.extendUserAccess);
router.post("/users/:id/subscription/grant", requirePermission("users.edit"), controller.grantUserPlan);
router.get("/users/:id/content-access", requirePermission("users.view"), controller.userContentAccess);
router.post("/users/:id/content-access/course/:courseId", requirePermission("users.edit"), controller.setCourseAccess);
router.post("/users/:id/content-access/topic/:topicId", requirePermission("users.edit"), controller.setTopicAccess);
router.post("/users/:id/content-access/course/:courseId/extend", requirePermission("users.edit"), controller.extendCourseAccess);
router.post("/users/:id/content-access/topic/:topicId/extend", requirePermission("users.edit"), controller.extendTopicAccess);
router.delete("/users/:id", authorize("superadmin"), controller.removeUser);
router.get("/content/pending", requirePermission("courses.publish"), controller.pendingContent);
router.put("/content/course/:id/approve", requirePermission("courses.publish"), controller.approveCourse);
router.delete("/content/course/:id/reject", requirePermission("courses.publish"), controller.rejectCourse); // now soft reject
router.get("/payments", authorize("superadmin"), controller.payments);
router.get("/payments/export", authorize("superadmin"), controller.exportPayments);
router.put("/payments/:id/refund", authorize("superadmin"), controller.refund);
router.put("/payments/:id/force-grant", authorize("superadmin"), controller.forceGrantPayment);
router.delete("/payments/:id", authorize("superadmin"), controller.deletePendingPayment);
router.post("/cms/blog", controller.createBlog);
router.put("/cms/blog/:id", controller.updateBlog);
router.delete("/cms/blog/:id", controller.deleteBlog);
router.get("/blogs", controller.getBlogs);
router.get("/blogs/:id", controller.getBlogById);
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
router.get("/analytics/revenue", requirePermission("analytics.view"), controller.getRevenueAnalytics);
router.get("/analytics/users", requirePermission("analytics.view"), controller.getUserAnalytics);
router.get("/analytics/tests", requirePermission("analytics.view"), controller.getTestAnalytics);
router.get("/analytics/courses", requirePermission("analytics.view"), controller.getCourseAnalytics);

// -------------------- Teacher Feature Settings --------------------
router.get("/settings/teacher", requirePermission("settings.view"), controller.getTeacherSettings);
router.put("/settings/teacher", requirePermission("settings.edit"), controller.updateTeacherSettings);

// -------------------- Site Content (Landing-page CMS) --------------------
router.get("/site-content", requirePermission("settings.view"), controller.getSiteContent);
router.put("/site-content", requirePermission("settings.edit"), controller.updateSiteContent);
// Generic image upload — used by SiteContent (review avatars, bento images).
router.post("/site-content/upload-image", requirePermission("settings.edit"), upload.single("image"), controller.uploadSiteImage);

export default router;
