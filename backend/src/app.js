import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes.js";

import otpRoutes from "./modules/otp/otp.routes.js";
import { requestLogger } from "./middlewares/requestlogger.middLeware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import studentRoutes from "./modules/student/student.route.js";
import teacherRoutes from "./modules/teacher/teacher.route.js";
import notesRoutes from "./modules/teacher/note.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import questionRoutes from "./modules/question/question.routes.js";
import testAttemptRoutes from "./modules/testAttempt/testAttempt.routes.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import adminRoutes from "./modules/admin/admin.route.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
const app = express();
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:4040",
    "https://pharmacist-shubham-api.onrender.com/"
  ],
  credentials: true
}));
app.use(apiLimiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/notes", notesRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/test", testAttemptRoutes);
app.use("/api/admin", adminRoutes);
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;