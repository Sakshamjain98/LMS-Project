import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Step 1: Ensure user is authenticated
    if (!req.user) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        MESSAGES.TOKEN_INVALID || "Unauthorized"
      );
    }
    // Step 2: Role-based access check
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        MESSAGES.ACCESS_DENIED
      );
    }
    next();
  };
};
