import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/token.js";

export const registerUserService = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      STATUS_CODES.CONFLICT,
      MESSAGES.USER_ALREADY_EXISTS
    );
  }
  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  return user;
};
export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(
      STATUS_CODES.UNAUTHORIZED,
      MESSAGES.INVALID_CREDENTIALS
    );
  }
  const isPasswordValid = await comparePassword(
    password,
    user.password
  );
  if (!isPasswordValid) {
    throw new ApiError(
      STATUS_CODES.UNAUTHORIZED,
      MESSAGES.INVALID_CREDENTIALS
    );
  }
  const token = generateToken({ userId: user._id });
  return { token, user };
};
