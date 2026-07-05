import express from "express";
import * as controller from "./aits.controller.js";

const router = express.Router();

// All routes require auth + teacher/admin — mounted via teacher.route.js

// GET /teacher/aits/exam/:examId
router.get("/exam/:examId", controller.getByExam);

// POST /teacher/aits
router.post("/", controller.create);

// PUT /teacher/aits/:aitsId
router.put("/:aitsId", controller.update);

// PATCH /teacher/aits/reorder — bulk reorder (drag-and-drop)
router.patch("/reorder", controller.reorder);

// DELETE /teacher/aits/:aitsId
router.delete("/:aitsId", controller.remove);

// POST /teacher/aits/:aitsId/tests
router.post("/:aitsId/tests", controller.createTest);

// PATCH /teacher/aits/:aitsId/tests/reorder — bulk reorder (drag-and-drop)
router.patch("/:aitsId/tests/reorder", controller.reorderTests);

export default router;
