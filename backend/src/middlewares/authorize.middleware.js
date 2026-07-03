import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        MESSAGES.TOKEN_INVALID || "Unauthorized"
      );
    }
    // Superadmin bypasses every role gate project-wide — fixing it here once
    // avoids touching ~30 authorize(...) call sites individually.
    if (req.user.role === "superadmin") return next();
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        MESSAGES.ACCESS_DENIED
      );
    }
    next();
  };
};
