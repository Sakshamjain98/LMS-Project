import Subscription from "../models/subscription.model.js";
import { ApiError } from "../shared/error/ApiError.js";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";
import { SUBSCRIPTION_PLANS } from "../constants/subscription.js";

export const requireSubscription = (requiredPlans = []) => {
  return async (req, res, next) => {
    if (!requiredPlans.length) return next();

    const userId = req.user._id;
    const sub = await Subscription.findOne({
      userId,
      status: "ACTIVE",
    });

    const userPlan = sub ? sub.plan : "FREE";

    if (!requiredPlans.includes(userPlan)) {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        MESSAGES.SUBSCRIPTION_REQUIRED
      );
    }

    next();
  };
};