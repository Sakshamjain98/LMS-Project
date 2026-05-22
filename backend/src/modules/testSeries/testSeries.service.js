import mongoose from "mongoose";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import TestSeriesSubject from "../../models/testSeriesSubject.model.js";
import TestSeriesChapter from "../../models/testSeriesChapter.model.js";
import ExamCategory from "../../models/examCategory.model.js";
import Exam from "../../models/exam.model.js";
import AllIndiaTestSeries from "../../models/allIndiaTestSeries.model.js";
import Test from "../test/test.model.js";
import Question from "../../models/question.model.js";
import TestAttempt from "../../models/testAttempt.model.js";
import TestConfig from "../../models/testConfig.model.js";
import TopicAccess from "../../models/topicAccess.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

const validateObjectId = (value, label) => {
  if (!value) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `${label} is required`);
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid ${label} format`);
  }
  return new mongoose.Types.ObjectId(value);
};

const normalizeTitle = (value, label) => {
  const title = (value || "").toString().trim();
  if (!title || title.length < 3) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `${label} must be at least 3 characters`);
  }
  return title.slice(0, 120);
};

const normalizeDescription = (value) => {
  const desc = (value || "").toString().trim();
  return desc.slice(0, 1000);
};

const cascadeDeleteTests = async (testIds = []) => {
  if (!testIds.length) return;

  await Promise.all([
    Question.deleteMany({ testId: { $in: testIds } }),
    TestConfig.deleteMany({ testId: { $in: testIds } }),
    TestAttempt.deleteMany({ testId: { $in: testIds } }),
  ]);

  await Test.deleteMany({ _id: { $in: testIds } });
};

export const assignTopicToExam = async (topicId, examId, teacherId) => {
  const objTopicId = validateObjectId(topicId, "topicId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  let examObjId = null;
  if (examId) {
    examObjId = validateObjectId(examId, "examId");
    const exam = await (await import("../../models/exam.model.js")).default.findById(examObjId).lean();
    if (!exam) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");
  }

  const updated = await TestSeriesTopic.findOneAndUpdate(
    { _id: objTopicId, teacherId: objTeacherId },
    { $set: { examId: examObjId } },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test series not found");
  return updated;
};

export const createTopic = async (payload, teacherId) => {
  const title = normalizeTitle(payload?.title, "Topic title");
  const description = normalizeDescription(payload?.description);
  const isPaid = Boolean(payload?.isPaid);
  const price = Math.max(0, Number(payload?.price) || 0);

  let examId = null;
  if (payload?.examId) {
    examId = validateObjectId(payload.examId, "examId");
  }

  return TestSeriesTopic.create({
    title,
    description,
    isPaid,
    price: isPaid ? price : 0,
    teacherId: validateObjectId(teacherId, "teacherId"),
    examId,
  });
};

export const updateTopic = async (topicId, payload, teacherId) => {
  const updates = {};
  if (payload?.title !== undefined) {
    updates.title = normalizeTitle(payload.title, "Topic title");
  }
  if (payload?.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }
  if (payload?.isPaid !== undefined) {
    updates.isPaid = Boolean(payload.isPaid);
  }
  if (payload?.price !== undefined) {
    updates.price = Math.max(0, Number(payload.price) || 0);
  }
  // If admin marks topic free, force price to 0 to keep state consistent.
  if (updates.isPaid === false) {
    updates.price = 0;
  }

  const updated = await TestSeriesTopic.findOneAndUpdate(
    { _id: validateObjectId(topicId, "topicId"), teacherId: validateObjectId(teacherId, "teacherId") },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Topic not found");
  }

  return updated;
};

export const deleteTopic = async (topicId, teacherId) => {
  const objTopicId = validateObjectId(topicId, "topicId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const subjects = await TestSeriesSubject.find({ topicId: objTopicId, teacherId: objTeacherId }).lean();
  const subjectIds = subjects.map((s) => s._id);

  const chapters = subjectIds.length
    ? await TestSeriesChapter.find({ subjectId: { $in: subjectIds }, teacherId: objTeacherId }).lean()
    : [];
  const chapterIds = chapters.map((c) => c._id);

  const tests = chapterIds.length
    ? await Test.find({ chapterId: { $in: chapterIds }, teacherId: objTeacherId }).lean()
    : [];
  const testIds = tests.map((t) => t._id);

  await cascadeDeleteTests(testIds);

  if (chapterIds.length) {
    await TestSeriesChapter.deleteMany({ _id: { $in: chapterIds } });
  }
  if (subjectIds.length) {
    await TestSeriesSubject.deleteMany({ _id: { $in: subjectIds } });
  }

  const deleted = await TestSeriesTopic.findOneAndDelete({ _id: objTopicId, teacherId: objTeacherId });
  if (!deleted) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Topic not found");
  }

  return deleted;
};

export const createSubject = async (topicId, payload, teacherId) => {
  const objTopicId = validateObjectId(topicId, "topicId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const topic = await TestSeriesTopic.findOne({ _id: objTopicId, teacherId: objTeacherId }).lean();
  if (!topic) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Topic not found");
  }

  return TestSeriesSubject.create({
    title: normalizeTitle(payload?.title, "Subject title"),
    description: normalizeDescription(payload?.description),
    topicId: objTopicId,
    teacherId: objTeacherId,
  });
};

export const updateSubject = async (subjectId, payload, teacherId) => {
  const updates = {};
  if (payload?.title !== undefined) {
    updates.title = normalizeTitle(payload.title, "Subject title");
  }
  if (payload?.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }

  const updated = await TestSeriesSubject.findOneAndUpdate(
    { _id: validateObjectId(subjectId, "subjectId"), teacherId: validateObjectId(teacherId, "teacherId") },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  }

  return updated;
};

export const deleteSubject = async (subjectId, teacherId) => {
  const objSubjectId = validateObjectId(subjectId, "subjectId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const chapters = await TestSeriesChapter.find({ subjectId: objSubjectId, teacherId: objTeacherId }).lean();
  const chapterIds = chapters.map((c) => c._id);

  const tests = chapterIds.length
    ? await Test.find({ chapterId: { $in: chapterIds }, teacherId: objTeacherId }).lean()
    : [];
  const testIds = tests.map((t) => t._id);

  await cascadeDeleteTests(testIds);

  if (chapterIds.length) {
    await TestSeriesChapter.deleteMany({ _id: { $in: chapterIds } });
  }

  const deleted = await TestSeriesSubject.findOneAndDelete({ _id: objSubjectId, teacherId: objTeacherId });
  if (!deleted) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  }

  return deleted;
};

export const createChapter = async (subjectId, payload, teacherId) => {
  const objSubjectId = validateObjectId(subjectId, "subjectId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const subject = await TestSeriesSubject.findOne({ _id: objSubjectId, teacherId: objTeacherId }).lean();
  if (!subject) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  }

  return TestSeriesChapter.create({
    title: normalizeTitle(payload?.title, "Chapter title"),
    description: normalizeDescription(payload?.description),
    subjectId: objSubjectId,
    teacherId: objTeacherId,
  });
};

export const updateChapter = async (chapterId, payload, teacherId) => {
  const updates = {};
  if (payload?.title !== undefined) {
    updates.title = normalizeTitle(payload.title, "Chapter title");
  }
  if (payload?.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }

  const updated = await TestSeriesChapter.findOneAndUpdate(
    { _id: validateObjectId(chapterId, "chapterId"), teacherId: validateObjectId(teacherId, "teacherId") },
    { $set: updates },
    { new: true }
  ).lean();

  if (!updated) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  }

  return updated;
};

export const deleteChapter = async (chapterId, teacherId) => {
  const objChapterId = validateObjectId(chapterId, "chapterId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const tests = await Test.find({ chapterId: objChapterId, teacherId: objTeacherId }).lean();
  const testIds = tests.map((t) => t._id);

  await cascadeDeleteTests(testIds);

  const deleted = await TestSeriesChapter.findOneAndDelete({ _id: objChapterId, teacherId: objTeacherId });
  if (!deleted) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  }

  return deleted;
};

export const getTeacherSeriesTree = async (teacherId) => {
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const topics = await TestSeriesTopic.find({ teacherId: objTeacherId }).sort({ createdAt: -1 }).lean();
  if (!topics.length) {
    return [];
  }

  const topicIds = topics.map((t) => t._id);
  const subjects = await TestSeriesSubject.find({ teacherId: objTeacherId, topicId: { $in: topicIds } })
    .sort({ createdAt: 1 })
    .lean();
  const subjectIds = subjects.map((s) => s._id);

  const chapters = subjectIds.length
    ? await TestSeriesChapter.find({ teacherId: objTeacherId, subjectId: { $in: subjectIds } })
        .sort({ createdAt: 1 })
        .lean()
    : [];
  const chapterIds = chapters.map((c) => c._id);

  const tests = chapterIds.length
    ? await Test.find({ teacherId: objTeacherId, chapterId: { $in: chapterIds } })
        .select("title description status totalMarks duration startTime endTime chapterId subjectId topicId createdAt questions isPaid isProctored attemptLimit")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const subjectsByTopic = new Map();
  subjects.forEach((subject) => {
    const list = subjectsByTopic.get(subject.topicId.toString()) || [];
    list.push({ ...subject, chapters: [] });
    subjectsByTopic.set(subject.topicId.toString(), list);
  });

  const chaptersBySubject = new Map();
  chapters.forEach((chapter) => {
    const list = chaptersBySubject.get(chapter.subjectId.toString()) || [];
    list.push({ ...chapter, tests: [] });
    chaptersBySubject.set(chapter.subjectId.toString(), list);
  });

  const testsByChapter = new Map();
  tests.forEach((test) => {
    const list = testsByChapter.get(test.chapterId?.toString()) || [];
    list.push(test);
    testsByChapter.set(test.chapterId?.toString(), list);
  });

  subjectsByTopic.forEach((subjectList) => {
    subjectList.forEach((subject) => {
      subject.chapters = chaptersBySubject.get(subject._id.toString()) || [];
      subject.chapters.forEach((chapter) => {
        chapter.tests = testsByChapter.get(chapter._id.toString()) || [];
      });
    });
  });

  return topics.map((topic) => ({
    ...topic,
    subjects: subjectsByTopic.get(topic._id.toString()) || [],
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-test-series analytics for the admin dashboard.
// Aggregates engagement, performance, demand, and revenue for one topic.
// ─────────────────────────────────────────────────────────────────────────────
export const getTopicAnalytics = async (topicId, teacherId) => {
  const objTopicId = validateObjectId(topicId, "topicId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const topic = await TestSeriesTopic.findOne({ _id: objTopicId, teacherId: objTeacherId }).lean();
  if (!topic) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test series not found");

  const subjects = await TestSeriesSubject.find({ topicId: objTopicId, teacherId: objTeacherId }).lean();
  const subjectIds = subjects.map((s) => s._id);
  const chapters = subjectIds.length
    ? await TestSeriesChapter.find({ subjectId: { $in: subjectIds }, teacherId: objTeacherId }).lean()
    : [];
  const chapterIds = chapters.map((c) => c._id);
  const tests = chapterIds.length
    ? await Test.find({ chapterId: { $in: chapterIds }, teacherId: objTeacherId })
        .select("title status totalMarks duration chapterId subjectId topicId isProctored isPaid")
        .lean()
    : [];
  const testIds = tests.map((t) => t._id);

  const perTest = testIds.length
    ? await TestAttempt.aggregate([
        { $match: { testId: { $in: testIds } } },
        {
          $group: {
            _id: "$testId",
            attempts: { $sum: 1 },
            uniqueStudents: { $addToSet: "$studentId" },
            avgPercent: { $avg: "$percentage" },
            maxPercent: { $max: "$percentage" },
            avgTime: { $avg: "$timeTaken" },
            completed: {
              $sum: { $cond: [{ $in: ["$status", ["submitted", "evaluated"]] }, 1, 0] },
            },
            firstAttemptAt: { $min: "$createdAt" },
            lastAttemptAt: { $max: "$createdAt" },
          },
        },
      ])
    : [];

  const statsByTest = new Map(perTest.map((row) => [row._id.toString(), row]));

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyActivity = testIds.length
    ? await TestAttempt.aggregate([
        { $match: { testId: { $in: testIds }, createdAt: { $gte: thirtyAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            attempts: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
    : [];

  const totalAttempts = perTest.reduce((sum, t) => sum + (t.attempts || 0), 0);
  const totalCompleted = perTest.reduce((sum, t) => sum + (t.completed || 0), 0);
  const uniqueStudentsAcrossTopic = new Set();
  perTest.forEach((t) => (t.uniqueStudents || []).forEach((id) => uniqueStudentsAcrossTopic.add(id.toString())));
  const totalUniqueStudents = uniqueStudentsAcrossTopic.size;
  const overallAvgPercent =
    totalAttempts > 0
      ? perTest.reduce((sum, t) => sum + (t.avgPercent || 0) * (t.attempts || 0), 0) / totalAttempts
      : 0;

  const testBreakdown = tests
    .map((test) => {
      const stat = statsByTest.get(test._id.toString());
      return {
        _id: test._id,
        title: test.title,
        status: test.status,
        chapterId: test.chapterId,
        subjectId: test.subjectId,
        attempts: stat?.attempts || 0,
        uniqueStudents: stat ? stat.uniqueStudents.length : 0,
        avgPercent: Math.round((stat?.avgPercent || 0) * 10) / 10,
        maxPercent: Math.round((stat?.maxPercent || 0) * 10) / 10,
        avgTimeMin: stat ? Math.round((stat.avgTime || 0) / 60) : 0,
        completed: stat?.completed || 0,
        lastAttemptAt: stat?.lastAttemptAt || null,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);

  const chaptersBySubject = new Map();
  chapters.forEach((c) => {
    const list = chaptersBySubject.get(c.subjectId.toString()) || [];
    list.push(c);
    chaptersBySubject.set(c.subjectId.toString(), list);
  });
  const testsByChapter = new Map();
  testBreakdown.forEach((t) => {
    const list = testsByChapter.get(t.chapterId?.toString()) || [];
    list.push(t);
    testsByChapter.set(t.chapterId?.toString(), list);
  });

  const subjectBreakdown = subjects.map((s) => {
    const subjChapters = chaptersBySubject.get(s._id.toString()) || [];
    let attempts = 0;
    let testsInSubject = 0;
    subjChapters.forEach((c) => {
      const ts = testsByChapter.get(c._id.toString()) || [];
      testsInSubject += ts.length;
      attempts += ts.reduce((sum, t) => sum + t.attempts, 0);
    });
    return {
      _id: s._id,
      title: s.title,
      chapters: subjChapters.length,
      tests: testsInSubject,
      attempts,
    };
  });

  const revenueAgg = topic.isPaid
    ? await TopicAccess.aggregate([
        { $match: { topicId: objTopicId } },
        { $group: { _id: null, unlocks: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      ])
    : [];
  const revenue = revenueAgg[0] || { unlocks: 0, revenue: 0 };

  const leaderboard = testIds.length
    ? await TestAttempt.aggregate([
        { $match: { testId: { $in: testIds }, status: { $in: ["submitted", "evaluated"] } } },
        {
          $group: {
            _id: "$studentId",
            attempts: { $sum: 1 },
            totalMarks: { $sum: "$marksObtained" },
            avgPercent: { $avg: "$percentage" },
            bestPercent: { $max: "$percentage" },
            lastAttemptAt: { $max: "$createdAt" },
          },
        },
        { $sort: { totalMarks: -1, avgPercent: -1 } },
        { $limit: 50 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            studentId: "$_id",
            studentName: "$student.name",
            studentEmail: "$student.email",
            attempts: 1,
            totalMarks: 1,
            avgPercent: { $round: ["$avgPercent", 1] },
            bestPercent: { $round: ["$bestPercent", 1] },
            lastAttemptAt: 1,
          },
        },
      ])
    : [];

  return {
    topic: {
      _id: topic._id,
      title: topic.title,
      description: topic.description,
      isPaid: topic.isPaid,
      price: topic.price,
    },
    summary: {
      subjects: subjects.length,
      chapters: chapters.length,
      tests: tests.length,
      publishedTests: tests.filter((t) => t.status === "published").length,
      totalAttempts,
      totalCompleted,
      totalUniqueStudents,
      overallAvgPercent: Math.round(overallAvgPercent * 10) / 10,
      revenue: revenue.revenue || 0,
      unlocks: revenue.unlocks || 0,
    },
    dailyActivity,
    subjectBreakdown,
    testBreakdown,
    leaderboard,
  };
};

export const getStudentSeriesTree = async () => {
  const topics = await TestSeriesTopic.find({}).sort({ createdAt: -1 }).lean();
  if (!topics.length) {
    return [];
  }

  const topicIds = topics.map((t) => t._id);
  const subjects = await TestSeriesSubject.find({ topicId: { $in: topicIds } })
    .sort({ createdAt: 1 })
    .lean();
  const subjectIds = subjects.map((s) => s._id);

  const chapters = subjectIds.length
    ? await TestSeriesChapter.find({ subjectId: { $in: subjectIds } })
        .sort({ createdAt: 1 })
        .lean()
    : [];
  const chapterIds = chapters.map((c) => c._id);

  const tests = chapterIds.length
    ? await Test.find({ chapterId: { $in: chapterIds }, status: "published" })
        .select("title description status totalMarks duration startTime endTime chapterId subjectId topicId questions isPaid isProctored attemptLimit type")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const subjectsByTopic = new Map();
  subjects.forEach((subject) => {
    const list = subjectsByTopic.get(subject.topicId.toString()) || [];
    list.push({ ...subject, chapters: [] });
    subjectsByTopic.set(subject.topicId.toString(), list);
  });

  const chaptersBySubject = new Map();
  chapters.forEach((chapter) => {
    const list = chaptersBySubject.get(chapter.subjectId.toString()) || [];
    list.push({ ...chapter, tests: [] });
    chaptersBySubject.set(chapter.subjectId.toString(), list);
  });

  const testsByChapter = new Map();
  tests.forEach((test) => {
    const list = testsByChapter.get(test.chapterId?.toString()) || [];
    list.push(test);
    testsByChapter.set(test.chapterId?.toString(), list);
  });

  subjectsByTopic.forEach((subjectList) => {
    subjectList.forEach((subject) => {
      subject.chapters = chaptersBySubject.get(subject._id.toString()) || [];
      subject.chapters.forEach((chapter) => {
        chapter.tests = testsByChapter.get(chapter._id.toString()) || [];
      });
    });
  });

  return topics.map((topic) => ({
    ...topic,
    subjects: subjectsByTopic.get(topic._id.toString()) || [],
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Full hierarchy: ExamCategory → Exam → (TestSeries + AITS) for admin/student.
// publishedOnly: true  → student view (only published tests, AITS unlocked)
// publishedOnly: false → admin/teacher view (all statuses)
// teacherId: if set, filter to that teacher's content only
// ─────────────────────────────────────────────────────────────────────────────
export const getFullHierarchyTree = async ({ publishedOnly = false, teacherId = null } = {}) => {
  const categories = await ExamCategory.find({}).sort({ order: 1, createdAt: 1 }).lean();

  const exams = await Exam.find({}).sort({ order: 1, createdAt: 1 }).lean();

  const topicQuery = {};
  if (teacherId) topicQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const topics = await TestSeriesTopic.find(topicQuery).sort({ createdAt: -1 }).lean();

  const topicIds = topics.map((t) => t._id);
  const subjectQuery = { topicId: { $in: topicIds } };
  if (teacherId) subjectQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const subjects = topicIds.length
    ? await TestSeriesSubject.find(subjectQuery).sort({ createdAt: 1 }).lean()
    : [];

  const subjectIds = subjects.map((s) => s._id);
  const chapterQuery = { subjectId: { $in: subjectIds } };
  if (teacherId) chapterQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const chapters = subjectIds.length
    ? await TestSeriesChapter.find(chapterQuery).sort({ createdAt: 1 }).lean()
    : [];

  const chapterIds = chapters.map((c) => c._id);
  const testQuery = { chapterId: { $in: chapterIds } };
  if (publishedOnly) testQuery.status = "published";
  if (teacherId) testQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const tests = chapterIds.length
    ? await Test.find(testQuery)
        .select("title description status totalMarks duration startTime endTime chapterId subjectId topicId questions isPaid isProctored attemptLimit type createdAt")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  // AITS
  const aitsQuery = {};
  if (teacherId) aitsQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const aitsList = await AllIndiaTestSeries.find(aitsQuery).sort({ order: 1, createdAt: 1 }).lean();
  const aitsIds = aitsList.map((a) => a._id);
  const aitsTestQuery = { aitsId: { $in: aitsIds }, type: "aits" };
  if (publishedOnly) aitsTestQuery.status = "published";
  if (teacherId) aitsTestQuery.teacherId = validateObjectId(teacherId, "teacherId");
  const aitsTests = aitsIds.length
    ? await Test.find(aitsTestQuery)
        .select("title description status totalMarks duration startTime endTime aitsId questions isPaid isProctored attemptLimit type createdAt")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  // --- Build maps ---
  const testsByChapter = new Map();
  tests.forEach((t) => {
    const list = testsByChapter.get(t.chapterId?.toString()) || [];
    list.push(t);
    testsByChapter.set(t.chapterId?.toString(), list);
  });

  const chaptersBySubject = new Map();
  chapters.forEach((c) => {
    const allTests = testsByChapter.get(c._id.toString()) || [];
    const practiceTests = allTests.filter((t) => t.type !== "pyq");
    const pyqTests = allTests.filter((t) => t.type === "pyq");
    const list = chaptersBySubject.get(c.subjectId.toString()) || [];
    list.push({ ...c, tests: allTests, practiceTests, pyqTests });
    chaptersBySubject.set(c.subjectId.toString(), list);
  });

  const subjectsByTopic = new Map();
  subjects.forEach((s) => {
    const list = subjectsByTopic.get(s.topicId.toString()) || [];
    list.push({ ...s, chapters: chaptersBySubject.get(s._id.toString()) || [] });
    subjectsByTopic.set(s.topicId.toString(), list);
  });

  const aitsTestsByAits = new Map();
  aitsTests.forEach((t) => {
    const list = aitsTestsByAits.get(t.aitsId?.toString()) || [];
    list.push(t);
    aitsTestsByAits.set(t.aitsId?.toString(), list);
  });

  const aitsByExam = new Map();
  aitsList.forEach((a) => {
    const list = aitsByExam.get(a.examId.toString()) || [];
    list.push({ ...a, tests: aitsTestsByAits.get(a._id.toString()) || [] });
    aitsByExam.set(a.examId.toString(), list);
  });

  const topicsByExam = new Map();
  // Topics with an examId go under their exam; orphan topics (no examId) go under a virtual exam.
  const orphanTopics = [];
  topics.forEach((topic) => {
    if (topic.examId) {
      const list = topicsByExam.get(topic.examId.toString()) || [];
      list.push({ ...topic, subjects: subjectsByTopic.get(topic._id.toString()) || [] });
      topicsByExam.set(topic.examId.toString(), list);
    } else {
      orphanTopics.push({ ...topic, subjects: subjectsByTopic.get(topic._id.toString()) || [] });
    }
  });

  const examsByCat = new Map();
  exams.forEach((exam) => {
    const list = examsByCat.get(exam.examCategoryId.toString()) || [];
    list.push({
      ...exam,
      testSeries: topicsByExam.get(exam._id.toString()) || [],
      allIndiaTestSeries: aitsByExam.get(exam._id.toString()) || [],
    });
    examsByCat.set(exam.examCategoryId.toString(), list);
  });

  const result = categories.map((cat) => ({
    ...cat,
    exams: examsByCat.get(cat._id.toString()) || [],
  }));

  // Append orphan topics (existing data before the hierarchy migration) as a synthetic category
  if (orphanTopics.length) {
    result.push({
      _id: "uncategorized",
      title: "Uncategorized",
      description: "Test series not yet assigned to an exam",
      slug: "uncategorized",
      exams: [
        {
          _id: "uncategorized-exam",
          title: "Uncategorized",
          slug: "uncategorized-exam",
          testSeries: orphanTopics,
          allIndiaTestSeries: [],
        },
      ],
    });
  }

  return result;
};
