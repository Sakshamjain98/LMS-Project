import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";

// Chained AFTER authorize(...), not merged into it — this needs to sit behind
// two different base gates (admin-only routes, and routes shared with teacher).
// Superadmin is always unrestricted; teacher routes are already scoped to the
// teacher's own content in the service layer, so permissions[] only applies
// to role === "admin".
export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.TOKEN_INVALID);
  }
  if (req.user.role === "superadmin" || req.user.role === "teacher") {
    return next();
  }
  if (
    req.user.role === "admin" &&
    Array.isArray(req.user.permissions) &&
    req.user.permissions.includes(permission)
  ) {
    return next();
  }
  throw new ApiError(STATUS_CODES.FORBIDDEN, MESSAGES.ACCESS_DENIED);
};
