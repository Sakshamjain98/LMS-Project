import mongoose from "mongoose";
import AllIndiaTestSeries from "../../models/allIndiaTestSeries.model.js";
import Exam from "../../models/exam.model.js";
import Test from "../test/test.model.js";
import Question from "../../models/question.model.js";
import TestAttempt from "../../models/testAttempt.model.js";
import TestConfig from "../../models/testConfig.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

const validateObjectId = (value, label) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value))
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
};

const normalizeTitle = (value, label) => {
  const t = (value || "").toString().trim();
  if (!t || t.length < 2)
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `${label} must be at least 2 characters`);
  return t.slice(0, 120);
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

// ─── AITS CRUD ─────────────────────────────────────────────────────────────

export const createAITS = async (payload, teacherId) => {
  const objTeacherId = validateObjectId(teacherId, "teacherId");
  const examId = validateObjectId(payload?.examId, "examId");

  const exam = await Exam.findById(examId).lean();
  if (!exam) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");

  const isPaid = Boolean(payload?.isPaid);
  const price = Math.max(0, Number(payload?.price) || 0);

  return AllIndiaTestSeries.create({
    title: normalizeTitle(payload?.title, "AITS title"),
    description: (payload?.description || "").toString().trim().slice(0, 1000),
    examId,
    teacherId: objTeacherId,
    isPaid,
    price: isPaid ? price : 0,
    order: Number(payload?.order) || 0,
  });
};

export const updateAITS = async (aitsId, payload, teacherId) => {
  const objAitsId = validateObjectId(aitsId, "aitsId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const updates = {};
  if (payload?.title !== undefined) updates.title = normalizeTitle(payload.title, "AITS title");
  if (payload?.description !== undefined)
    updates.description = payload.description.toString().trim().slice(0, 1000);
  if (payload?.isPaid !== undefined) updates.isPaid = Boolean(payload.isPaid);
  if (payload?.price !== undefined) updates.price = Math.max(0, Number(payload.price) || 0);
  if (payload?.order !== undefined) updates.order = Number(payload.order) || 0;
  if (updates.isPaid === false) updates.price = 0;

  const updated = await AllIndiaTestSeries.findOneAndUpdate(
    { _id: objAitsId, teacherId: objTeacherId },
    { $set: updates },
    { new: true }
  ).lean();
  if (!updated) throw new ApiError(STATUS_CODES.NOT_FOUND, "AITS not found");
  return updated;
};

export const deleteAITS = async (aitsId, teacherId) => {
  const objAitsId = validateObjectId(aitsId, "aitsId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const tests = await Test.find({ aitsId: objAitsId, teacherId: objTeacherId }).lean();
  await cascadeDeleteTests(tests.map((t) => t._id));

  const deleted = await AllIndiaTestSeries.findOneAndDelete({
    _id: objAitsId,
    teacherId: objTeacherId,
  });
  if (!deleted) throw new ApiError(STATUS_CODES.NOT_FOUND, "AITS not found");
  return deleted;
};

export const getAITSByExam = async (examId, teacherId = null) => {
  const objExamId = validateObjectId(examId, "examId");
  const query = { examId: objExamId };
  if (teacherId) query.teacherId = validateObjectId(teacherId, "teacherId");

  const aitsList = await AllIndiaTestSeries.find(query).sort({ order: 1, createdAt: 1 }).lean();
  if (!aitsList.length) return [];

  const aitsIds = aitsList.map((a) => a._id);
  const testQuery = { aitsId: { $in: aitsIds } };
  if (teacherId) testQuery.teacherId = validateObjectId(teacherId, "teacherId");

  const tests = await Test.find(testQuery)
    .select("title description status totalMarks duration startTime endTime aitsId questions isPaid isProctored attemptLimit type createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const testsByAits = new Map();
  tests.forEach((t) => {
    const list = testsByAits.get(t.aitsId?.toString()) || [];
    list.push(t);
    testsByAits.set(t.aitsId?.toString(), list);
  });

  return aitsList.map((a) => ({
    ...a,
    tests: testsByAits.get(a._id.toString()) || [],
  }));
};

// ─── Tests inside AITS ────────────────────────────────────────────────────

export const createAITSTest = async (aitsId, payload, teacherId) => {
  const objAitsId = validateObjectId(aitsId, "aitsId");
  const objTeacherId = validateObjectId(teacherId, "teacherId");

  const aits = await AllIndiaTestSeries.findOne({
    _id: objAitsId,
    teacherId: objTeacherId,
  }).lean();
  if (!aits) throw new ApiError(STATUS_CODES.NOT_FOUND, "AITS not found");

  return Test.create({
    ...payload,
    aitsId: objAitsId,
    teacherId: objTeacherId,
    type: "aits",
    // Clear chapter/subject/topic refs — AITS tests don't belong to series hierarchy
    chapterId: null,
    subjectId: null,
    topicId: null,
  });
};
