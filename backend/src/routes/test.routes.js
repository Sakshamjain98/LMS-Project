import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user,
  });
});
export default router;