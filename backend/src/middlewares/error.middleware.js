import { STATUS_CODES } from "../constants/statusCode.js";

export const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || STATUS_CODES.INTERNAL_SERVER).json({
    message: err.message || "Internal Server Error",
  });
};
