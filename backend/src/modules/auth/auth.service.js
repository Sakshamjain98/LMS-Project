import User from "../../models/user.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { hashPassword, comparePassword } from "../../shared/utils/bcrypt.js";
import { generateToken } from "../../shared/utils/token.js";
import { OAuth2Client } from "google-auth-library";
import crypto from 'crypto';
import { sendResetPasswordEmail} from "../../shared/utils/email.util.js"
export const registerUserService = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(STATUS_CODES.CONFLICT, MESSAGES.USER_ALREADY_EXISTS);
  }
  const hashedPassword = await hashPassword(password);
  const isApproved = role === 'student';
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

    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }

  } else {

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







export const forgotPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) {

    return { message: MESSAGES.FORGOT_PASSWORD_EMAIL_SENT };
  }


  const resetToken = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');


  const expires = Date.now() + 3600000; 

  user.passwordResetToken = tokenHash;
  user.passwordResetExpires = expires;
  await user.save();


  sendResetPasswordEmail(user.email, user.name, resetToken).catch(console.error);

  return { message: MESSAGES.FORGOT_PASSWORD_EMAIL_SENT };
};


export const resetPasswordService = async ({ token, password }) => {

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, 'Invalid or expired token');
  }


  const hashedPassword = await hashPassword(password);


  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordChangedAt = Date.now(); 
  await user.save();

  return { message: MESSAGES.PASSWORD_RESET_SUCCESS };
};