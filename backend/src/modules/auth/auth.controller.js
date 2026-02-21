import { registerUserService, loginUserService, googleLoginService } from "./auth.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUserService(req.body);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.USER_CREATED,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await loginUserService(req.body);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.LOGIN_SUCCESS,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { token, role } = req.body;
  const result = await googleLoginService({ token, role });
  res.json({
    success: true,
    message: "Google login successful",
    token: result.token,
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      isApproved: result.user.isApproved,
    },
  });
});