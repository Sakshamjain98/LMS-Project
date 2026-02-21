import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as controller from "./student.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("student"));

router.get("/dashboard", controller.dashboard);
router.get("/profile", controller.profile);
router.put("/profile", controller.updateProfile);
router.get("/free/courses", controller.freeCourses);
router.get("/free/notes", controller.freeNotes);
router.get("/blogs", controller.blogs);
router.get("/schedule", controller.schedule);
router.get("/payment-history", controller.paymentHistory);

export default router;
