import express from "express";
import { selectRole } from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { selectRoleSchema } from "../../shared/validations/auth.validation.js";

const router = express.Router();

router.post("/select-role", authMiddleware, validate(selectRoleSchema), selectRole);

export default router;