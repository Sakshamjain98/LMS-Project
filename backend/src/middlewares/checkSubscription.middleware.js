import Subscription from "../models/subscription.model.js";
import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";

export const checkSubscription = (isPaid) => {
  return async (req, res, next) => {
    if (!isPaid) return next();

    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: "ACTIVE",
    });

    if (!sub) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        MESSAGES.SUBSCRIPTION_REQUIRED
      );
    }
    next();
  };
};
