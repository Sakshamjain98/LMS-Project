import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        MESSAGES.ACCESS_DENIED
      );
    }
    next();
  };
};