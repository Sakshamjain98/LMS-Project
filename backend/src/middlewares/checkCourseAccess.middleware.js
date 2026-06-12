import Course from "../models/course.model.js";
import Subscription from "../models/subscription.model.js";
import { ApiError } from "../shared/error/ApiError.js";

export const checkCourseAccess = async (req, res, next) => {
  const courseId = req.params.id;
  const userId = req.user._id;
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");
  if (!course.isPaid) return next();
  const sub = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    plan: { $ne: "FREE" },
    $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
  });
  if (!sub) {
    throw new ApiError(403, "This course requires a paid subscription");
  }
  next();
};