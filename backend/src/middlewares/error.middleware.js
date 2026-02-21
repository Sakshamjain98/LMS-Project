import { STATUS_CODES } from "../constants/statusCode.js";
import logger from "../infrastucture/logger/logger.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER;
  const message = err.message || "Internal Server Error";

  // Log error
  logger.error({
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?._id,
  });

  // Don't expose internal errors in production
  const response = {
    success: false,
    message: statusCode === STATUS_CODES.INTERNAL_SERVER && 
             process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : message,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
