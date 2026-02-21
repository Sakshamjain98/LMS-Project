import User from "../../models/user.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { hashPassword, comparePassword } from "../../shared/utils/bcrypt.js";
import { generateToken } from "../../shared/utils/token.js";
import { OAuth2Client } from "google-auth-library";

export const registerUserService = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(STATUS_CODES.CONFLICT, MESSAGES.USER_ALREADY_EXISTS);
  }

  const hashedPassword = await hashPassword(password);
  const isApproved = role === 'student'; // teachers need approval
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    isApproved,
  });
  return user;
};

export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password +isApproved");
  if (!user) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  // Teachers must be approved
  if (user.role === 'teacher' && !user.isApproved) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Your teacher account is pending admin approval.");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({ userId: user._id });
  return { token, user };
};

export const googleLoginService = async ({ token, role }) => {
  if (!token) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Google token is required");
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Google email not verified");
  }

  let user = await User.findOne({ email });

  if (user) {
    // Existing user: link Google account if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }
    // Do NOT change role – existing role takes precedence
  } else {
    // New user: create with provided role and set approval status
    const isApproved = role === 'student';
    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture,
      role,
      isApproved,
    });
  }

  const jwtToken = generateToken({ userId: user._id });
  return { token: jwtToken, user };
};