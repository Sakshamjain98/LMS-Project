import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";
import { markUserActive } from "../infrastucture/redis/activeUsers.redis.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        MESSAGES.TOKEN_MISSING
      );
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        MESSAGES.TOKEN_INVALID
      );
    }
    const user = await User.findById(decoded.userId).select("-password");
if (user.passwordChangedAt) {
  const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
  if (decoded.iat < changedTimestamp) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Token expired after password change');
  }
}

    if (!user) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        MESSAGES.USER_NOT_FOUND
      );
    }
    if (user.isActive === false) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, "This account has been disabled.");
    }
    req.user = user;
    markUserActive(user._id).catch((error) => {
      console.error("Failed to update active user state:", error?.message || error);
    });
    next();
  } catch (error) {
    next(error);
  }
};
