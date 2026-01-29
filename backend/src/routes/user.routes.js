import express from "express";
import { selectRole } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/select-role", authMiddleware, selectRole);

export default router;