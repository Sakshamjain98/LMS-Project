import express from "express";
import * as controller from "./exam.controller.js";

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:examId", controller.getById);
router.post("/", controller.create);
router.put("/:examId", controller.update);
router.patch("/reorder", controller.reorder);
router.delete("/:examId", controller.remove);

export default router;
