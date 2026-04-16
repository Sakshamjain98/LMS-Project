import Course from "../../models/course.model.js";
import Blog from "../../models/blog.model.js";
import User from "../../models/user.model.js";
import Test from "../test/test.model.js";
import TestConfig from "../../models/testConfig.model.js";
import QuestionAnalytics from "../../models/questionAnalysis.model.js";
import PlatformSettings, { DEFAULT_TEACHER_SETTINGS } from "../../models/platformSettings.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import Question from "../../models/question.model.js";

export const getTeacherUiSettings = async () => {
  const settings = await PlatformSettings.findOne({ key: "singleton" }).lean();

  if (!settings) {
    return DEFAULT_TEACHER_SETTINGS;
  }

  return {
    teacherVisibility: {
      ...DEFAULT_TEACHER_SETTINGS.teacherVisibility,
      ...(settings.teacherVisibility || {}),
    },
    teacherDashboardStats: {
      ...DEFAULT_TEACHER_SETTINGS.teacherDashboardStats,
      ...(settings.teacherDashboardStats || {}),
    },
  };
};

export const getDashboardData = async (teacherId) => {
  const [myCourses, blogs, uiSettings] = await Promise.all([
    Course.find({ educator: teacherId }).limit(10),
    Blog.find({ author: teacherId, published: true }).limit(5),
    getTeacherUiSettings(),
  ]);

  return {
    totalCourses: myCourses.length,
    myCourses,
    blogs,
    uiSettings,
  };
};

export const getProfile = async (userId) => {
  return User.findById(userId).select("-password").lean();
};

export const updateProfile = async (userId, data) => {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
};
// ================= COURSES =================
export const createCourse = async (data, educatorId) => {
  if (!data.title || data.title.trim().length < 3) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 3 characters");
  }

  // ✅ FIXED: Parse isPaid as boolean and only validate price if truly paid
  const isPaid = data.isPaid === "true" || data.isPaid === true;
  const price = isPaid ? parseFloat(data.price) : 0;

  if (isPaid && (!price || price <= 0)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Price is required and must be greater than 0 for paid courses");
  }

  return Course.create({
    title: data.title.trim(),
    description: data.description?.trim() || "",
    educator: educatorId,
    status: "pending",
    isApproved: false,
    thumbnail: data.thumbnail || null,
    isPaid: isPaid,
    price: price, // ✅ Always set price (0 for free, actual price for paid)
    tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(",").map(t => t.trim())) : [],
  });
};

export const getMyCourses = async (educatorId) => {
  return Course.find({ educator: educatorId }).lean();
};

export const getCourseById = async (courseId, educatorId) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId }).lean();

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  }

  return course;
};

export const updateCourse = async (courseId, educatorId, updateData) => {
  if (updateData.title) {
    updateData.title = updateData.title.trim();
    if (updateData.title.length < 3) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 3 characters");
    }
  }

  if (updateData.isPaid && (!updateData.price || updateData.price <= 0)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Price is required and must be greater than 0 for paid courses");
  }

  if (updateData.tags && !Array.isArray(updateData.tags)) {
    updateData.tags = updateData.tags.split(",").map(t => t.trim());
  }

  const course = await Course.findOneAndUpdate(
    { _id: courseId, educator: educatorId },
    { $set: updateData },
    { new: true }
  );

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found or unauthorized");
  }

  return course;
};

export const deleteCourse = async (courseId, educatorId) => {
  const course = await Course.findOneAndDelete({
    _id: courseId,
    educator: educatorId,
  });

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  }

  return course;
};

// ================= SECTIONS =================
export const addSection = async (courseId, educatorId, sectionData) => {
  if (!sectionData.title || sectionData.title.trim().length < 2) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Section title required");
  }

  const course = await Course.findOne({ _id: courseId, educator: educatorId });

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  }

  course.sections.push({
    ...sectionData,
    title: sectionData.title.trim(),
  });

  await course.save();
  return course;
};

export const updateSection = async (courseId, educatorId, sectionId, updates) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  }

  const section = course.sections.id(sectionId);

  if (!section) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");
  }

  Object.assign(section, updates);
  await course.save();

  return section;
};

export const deleteSection = async (courseId, educatorId, sectionId) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });

  if (!course) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  }

  const section = course.sections.id(sectionId);

  if (!section) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");
  }

  section.deleteOne();
  await course.save();

  return course;
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

  // Find section by ID (handle both string and ObjectId)
  const section = course.sections.find(s => s._id.toString() === sectionId.toString());
  
  if (!section) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, `Section not found with ID: ${sectionId}`);
  }

  // Validate video data
  if (!video.title || !video.url) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Video title and URL are required");
  }

  section.videos.push({
    title: video.title.trim(),
    url: video.url.trim(),
  });
  
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

export const updateVideoLink = async (courseId, educatorId, sectionId, videoIndex, updateData) => {
  const course = await Course.findOne({ _id: courseId, educator: educatorId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  // Find section by ID
  const section = course.sections.find(s => s._id.toString() === sectionId.toString());
  
  if (!section) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Section not found");
  }

  if (videoIndex < 0 || videoIndex >= section.videos.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid video index");
  }

  // Update video
  if (updateData.title) {
    section.videos[videoIndex].title = updateData.title.trim();
  }
  if (updateData.url) {
    section.videos[videoIndex].url = updateData.url.trim();
  }

  await course.save();
  return section.videos;
};

// ==================== Tests (unchanged) ====================
export const createTest = async (data, teacherId) => {
  const payload = data || {};

  return Test.create({
    title: payload.title?.trim() || "Untitled Test",
    description: payload.description?.trim() || "",
    duration: payload.duration || 60,
    passingMarks: payload.passingMarks || 0,

    // ✅ FREE / PAID
    isPaid: payload.isPaid ?? false,

    teacherId,
    status: "draft",
  });
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
  const question = await Question.findById(questionId);

  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  await Test.findByIdAndUpdate(testId, {
    $addToSet: { questions: question._id },
    $inc: { totalMarks: question.marks || 0 },
  });
};
export const bulkCreateQuestions = async (questionsArray, testId, teacherId) => {
  const questionsToInsert = questionsArray.map((q) => ({
    ...q,
    testId,
    createdBy: teacherId,
  }));

  const created = await Question.insertMany(questionsToInsert);

  const questionIds = created.map((q) => q._id);

  const totalMarks = created.reduce(
    (sum, q) => sum + (q.marks || 0),
    0
  );

  await Test.findByIdAndUpdate(testId, {
    $addToSet: { questions: { $each: questionIds } },
    $inc: { totalMarks: totalMarks },
  });

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



