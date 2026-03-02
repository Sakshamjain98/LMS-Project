import express from "express";
import * as controller from "./note.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("teacher"));

// Note CRUD
router.post("/", upload.single("file"), controller.createNote);
router.get("/", controller.getMyNotes);
router.get("/:id", controller.getNote);
router.put("/:id", upload.single("file"), controller.updateNote);
router.delete("/:id", controller.deleteNote);

export default router;