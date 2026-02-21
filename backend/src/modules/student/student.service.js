import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";

export const getDashboardData = async () => {
  const [freeCourses, blogs] = await Promise.all([
    Course.find({ isPaid: false }).limit(10),
    Blog.find({ published: true }).limit(5),
  ]);
  return { freeCourses, blogs };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select("-password").lean();
};

export const updateProfile = async (userId, data) => {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select(
    "-password"
  );
};
export const getFreeCourses = async () => {
  return Course.find({ isPaid: false }).lean();
};

export const getBlogs = async () => {
  return Blog.find({ published: true }).lean();
};

