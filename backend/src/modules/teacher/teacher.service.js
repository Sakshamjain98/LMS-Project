import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";
import Test from "../test/test.model.js";
import TestConfig from "../../models/testConfig.model.js";
import QuestionAnalytics from "../../models/questionAnalysis.model.js";

export const getDashboardData = async (teacherId) => {
  const [myCourses, blogs] = await Promise.all([
    Course.find({ educator: teacherId }).limit(10),
    Blog.find({ author: teacherId, published: true }).limit(5),
  ]);
  return { totalCourses: myCourses.length, myCourses, blogs };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select("-password").lean();
};

export const updateProfile = async (userId, data) => {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
};

export const createCourse = async (data, educatorId) => {
  return Course.create({ ...data, educator: educatorId });
};

export const getMyCourses = async (educatorId) => {
  return Course.find({ educator: educatorId }).lean();
};

export const getStudentPerformance = async () => {
  return [];
};

export const getTeacherTests = async (teacherId) => {
  return Test.find({ teacherId }).sort({ createdAt: -1 });
};

export const createTest = async (data, teacherId) => {
  return Test.create({ ...data, teacherId, status: "draft" });
};

export const addQuestions = async (testId, questionIds) => {
  return Test.findByIdAndUpdate(
    testId,
    { $addToSet: { questions: { $each: questionIds } } },
    { new: true }
  );
};

export const saveTestConfig = async (config) => {
  return TestConfig.create(config);
};

export const publishTest = async (testId, payload) => {
  return Test.findByIdAndUpdate(testId, payload, { new: true });
};

export const getTestAnalytics = async (testId) => {
  return { attempts: 1240, avgScore: 58, accuracy: 62, completionRate: 91 };
};

export const getQuestionAnalytics = async (testId) => {
  return QuestionAnalytics.find({ testId });
};