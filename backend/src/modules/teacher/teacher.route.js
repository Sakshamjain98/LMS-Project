import express from "express";
import * as controller from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorize("teacher"));
router.get("/dashboard", controller.dashboard);
router.get("/profile", controller.profile);
router.put("/profile", controller.updateProfile);
router.post(
  "/courses",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "notes", maxCount: 5 },
  ]),
  controller.createCourse
);
router.get("/courses", controller.myCourses);
router.get("/students/performance", controller.studentPerformance);
router.get("/tests", controller.listTests);
router.post("/tests", controller.createTest);
router.post("/tests/:id/questions", controller.addQuestions);
router.post("/tests/:id/config", controller.saveConfig);
router.get("/tests/:id/preview", controller.previewTest);
router.post("/tests/:id/publish", controller.publishTest);
router.get("/tests/:id/analytics", controller.analytics);

export default router;