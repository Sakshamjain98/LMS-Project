import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";
import { ROLES } from "../constants/roles.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.user._id;

    if (!Object.values(ROLES).includes(role)) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        MESSAGES.INVALID_ROLE
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(
        STATUS_CODES.NOT_FOUND,
        MESSAGES.USER_NOT_FOUND
      );
    }
    if (user.role) {
      throw new ApiError(
        STATUS_CODES.CONFLICT,
        MESSAGES.ROLE_ALREADY_ASSIGNED
      );
    }

    user.role = role;
    await user.save();

    res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.SUCCESS,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};
