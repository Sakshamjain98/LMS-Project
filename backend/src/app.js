import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import mongoose from "mongoose";
import authRoutes from "./modules/auth/auth.routes.js";

import otpRoutes from "./modules/otp/otp.routes.js";
import { requestLogger } from "./middlewares/requestlogger.middLeware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import studentRoutes from "./modules/student/student.route.js";
import teacherRoutes from "./modules/teacher/teacher.route.js";
import notesRoutes from "./modules/teacher/note.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import { razorpayWebhook } from "./modules/payment/payment.controller.js";
import questionRoutes from "./modules/question/question.routes.js";
import testAttemptRoutes from "./modules/testAttempt/testAttempt.routes.js";
import adminRoutes from "./modules/admin/admin.route.js";
import publicRoutes from "./modules/public/public.routes.js";
import courseRoutes from "./modules/courses/courses.routes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { mongoSanitizeMiddleware } from "./middlewares/mongoSanitize.middleware.js";

const app = express();

app.disable("x-powered-by");

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(mongoSanitizeMiddleware);
app.use(hpp());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    return callback(new Error("CORS policy violation"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
// Razorpay webhook MUST receive the raw body for HMAC signature verification, so
// it is registered before express.json() (which would otherwise consume/replace
// the raw stream with a parsed object).
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

app.use(express.json({ limit: process.env.REQUEST_SIZE_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_SIZE_LIMIT || "10mb" }));
app.use(requestLogger);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/ready", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({ status: "degraded", db: "disconnected" });
  }
  return res.status(200).json({ status: "ready", db: "connected" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin/payments", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/notes", notesRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/test", testAttemptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/courses", courseRoutes);

if (process.env.ENABLE_SWAGGER === "true") {
  const swaggerDocument = YAML.load("./swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;