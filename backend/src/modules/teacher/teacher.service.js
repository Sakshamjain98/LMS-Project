import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";
import Test from "../test/test.model.js";
import TestConfig from "../../models/testConfig.model.js";
import QuestionAnalytics from "../../models/questionAnalysis.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import Question from "../../models/question.model.js";
export const getDashboardData = async (teacherId) => {
  const [myCourses, blogs] = await Promise.all([
    Course.find({ educator: teacherId }).limit(10),
    Blog.find({ author: teacherId, published: true }).limit(5),
  ]);
  return {
    totalCourses: myCourses.length,
    myCourses,
    blogs,
  };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select("-password").lean();
};

export const updateProfile = async (userId, data) => {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
};
export const createCourse = async (data, educatorId) => {
  return Course.create({
    ...data,
    educator: educatorId,
    status: "pending",       
    isApproved: false           
  });
};
export const getMyCourses = async (educatorId) => {
  return Course.find({ educator: educatorId }).lean();
};

export const getCourseById = async (courseId, educatorId) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId }).lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  return course;
};

export const updateCourse = async (courseId, educatorId, updateData) => {
  const course = await Course.findOneAndUpdate(
    { _id: courseId, educator: educatorId },
    { $set: updateData },
    { new: true }
  );
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  return course;
};

export const deleteCourse = async (courseId, educatorId) => {
  const course = await Course.findOneAndDelete({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  return course;
};

export const addSection = async (courseId, educatorId, sectionData) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  course.sections.push(sectionData);
  await course.save();
  return course;
};
export const updateSection = async (courseId, educatorId, sectionId, updates) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const section = course.sections.id(sectionId);
  if (!section) throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");

  Object.assign(section, updates);
  await course.save();
  return section;
};
export const deleteSection = async (courseId, educatorId, sectionId) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  course.sections.id(sectionId).deleteOne();
  await course.save();
};
export const addNotesToSection = async (courseId, educatorId, sectionId, notes) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const section = course.sections.id(sectionId);
  if (!section) throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");

  section.notes.push(...notes);
  await course.save();
  return section;
};

export const addVideoLink = async (courseId, educatorId, sectionId, video) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const section = course.sections.id(sectionId);
  if (!section) throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");

  section.videos.push(video);
  await course.save();
  return section;
};

export const removeVideoLink = async (courseId, educatorId, sectionId, videoIndex) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const section = course.sections.id(sectionId);
  if (!section) throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");

  if (videoIndex < 0 || videoIndex >= section.videos.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid video index");
  }

  section.videos.splice(videoIndex, 1);
  await course.save();
  return section;
};

// ==================== Tests (unchanged) ====================
export const getTeacherTests = async (teacherId) => {
  return Test.find({ teacherId }).sort({ createdAt: -1 }).lean();
};

export const createTest = async (data, teacherId) => {
  return Test.create({ ...data, teacherId, status: "draft" });
};

export const getTestById = async (testId, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId }).lean();
  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  return test;
};

export const getTestWithQuestions = async (testId, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId })
    .populate("questions")
    .lean();
  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  return test;
};

export const createQuestion = async (data) => {
  const question = await Question.create(data);
  return question;
};

export const linkQuestionToTest = async (testId, questionId) => {
  await Test.findByIdAndUpdate(testId, { $addToSet: { questions: questionId } });
};

export const bulkCreateQuestions = async (questionsArray, testId, teacherId) => {
  const questionsToInsert = questionsArray.map(q => ({
    ...q,
    testId,
    createdBy: teacherId,
  }));
  const created = await Question.insertMany(questionsToInsert);
  const questionIds = created.map(q => q._id);
  await Test.findByIdAndUpdate(testId, { $addToSet: { questions: { $each: questionIds } } });
  return created;
};

export const saveTestConfig = async (config) => {
  return TestConfig.create(config);
};

export const publishTest = async (testId, payload) => {
  return Test.findByIdAndUpdate(testId, payload, { new: true });
};

export const getTestAnalytics = async (testId) => {
  // In a real system, you'd aggregate from attempts collection.
  // For now, return detailed dummy data.
  const questions = await Question.find({ testId }).lean();
  const questionAnalytics = await QuestionAnalytics.find({ testId }).lean();

  const totalAttempts = 1240; // dummy
  const avgScore = 58;
  const accuracy = 62;
  const completionRate = 91;
  const avgTimeSpent = 1245; // seconds

  const questionStats = questions.map(q => {
    const stats = questionAnalytics.find(a => a.questionId.toString() === q._id.toString()) || {};
    return {
      questionId: q._id,
      questionText: q.questionText,
      totalAttempts: stats.totalAttempts || 0,
      correctPercentage: stats.correctAttempts ? (stats.correctAttempts / stats.totalAttempts) * 100 : 0,
      avgTimeSpent: stats.avgTimeSpent || 0,
    };
  });

  return {
    testId,
    totalAttempts,
    avgScore,
    accuracy,
    completionRate,
    avgTimeSpent,
    questionStats,
  };
};

export const getQuestionAnalytics = async (questionId) => {
  return QuestionAnalytics.findOne({ questionId }).lean();
};
