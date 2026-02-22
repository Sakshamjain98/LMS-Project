import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import otpRoutes from "./modules/otp/otp.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/requestlogger.middleware.js";
import studentRoutes from "./modules/student/student.route.js";
import teacherRoutes from "./modules/teacher/teacher.route.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import questionRoutes from "./modules/question/question.routes.js";
import testAttemptRoutes from "./modules/testAttempt/testAttempt.routes.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import adminRoutes from "./modules/admin/admin.route.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

// Rate limiting
app.use(apiLimiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
// Request logging
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth/otp", otpRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/test", testAttemptRoutes);
app.use("/api/admin", adminRoutes);

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDocument = YAML.load("./swagger.yaml");

// ... after your other middlewares
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use(errorHandler);

export default app;