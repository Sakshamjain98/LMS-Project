import mongoose from "mongoose";
import Exam from "../../models/exam.model.js";
import ExamCategory from "../../models/examCategory.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import AllIndiaTestSeries from "../../models/allIndiaTestSeries.model.js";
import Course from "../../models/course.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { reorderItems } from "../../shared/utils/reorder.utils.js";

const slugify = (str) =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120);

const uniqueSlug = async (base, excludeId = null) => {
  let slug = slugify(base);
  let candidate = slug;
  let i = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Exam.findOne(query).lean();
    if (!existing) return candidate;
    candidate = `${slug}-${i++}`;
  }
};

const validateObjectId = (value, label) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value))
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
};

export const createExam = async (payload) => {
  const title = (payload?.title || "").toString().trim();
  if (!title || title.length < 2)
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 2 characters");

  const examCategoryId = validateObjectId(payload?.examCategoryId, "examCategoryId");
  const category = await ExamCategory.findById(examCategoryId).lean();
  if (!category) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam category not found");

  const slug = await uniqueSlug(title);
  return Exam.create({
    title: title.slice(0, 120),
    description: (payload?.description || "").toString().trim().slice(0, 1000),
    slug,
    examCategoryId,
    order: Number(payload?.order) || 0,
  });
};

export const updateExam = async (examId, payload) => {
  const id = validateObjectId(examId, "examId");
  const updates = {};

  if (payload?.title !== undefined) {
    const title = payload.title.toString().trim();
    if (!title || title.length < 2)
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 2 characters");
    updates.title = title.slice(0, 120);
    updates.slug = await uniqueSlug(title, examId);
  }
  if (payload?.description !== undefined)
    updates.description = payload.description.toString().trim().slice(0, 1000);
  if (payload?.examCategoryId !== undefined)
    updates.examCategoryId = validateObjectId(payload.examCategoryId, "examCategoryId");
  if (payload?.order !== undefined) updates.order = Number(payload.order) || 0;
  if (payload?.isVisible !== undefined) updates.isVisible = payload.isVisible !== false;

  const updated = await Exam.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!updated) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");
  return updated;
};

// Bulk drag-and-drop reorder: examIds is the full new order within a category.
export const reorderExams = async (examCategoryId, examIds) => {
  return reorderItems(Exam, { examCategoryId }, examIds);
};

export const deleteExam = async (examId) => {
  const id = validateObjectId(examId, "examId");

  const topicCount = await TestSeriesTopic.countDocuments({ examId: id });
  if (topicCount > 0)
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Cannot delete — ${topicCount} test series exist under this exam. Reassign or delete them first.`
    );

  const aitsCount = await AllIndiaTestSeries.countDocuments({ examId: id });
  if (aitsCount > 0)
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Cannot delete — ${aitsCount} AITS section(s) exist under this exam. Delete them first.`
    );

  // Cascade-delete every course under this exam (with its full subtree:
  // subjects, chapters, notes, videos and student access records) so deleted
  // courses don't linger on the student dashboard as orphans. Imported
  // dynamically to avoid changing module load order at startup.
  const courses = await Course.find({ examId: id }).select("_id").lean();
  if (courses.length) {
    const { deleteCourse } = await import("../courses/courses.service.js");
    for (const c of courses) {
      await deleteCourse(c._id);
    }
  }

  const deleted = await Exam.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");
  return deleted;
};

export const getExamsByCategory = async (categoryId) => {
  const id = validateObjectId(categoryId, "categoryId");
  return Exam.find({ examCategoryId: id }).sort({ order: 1, createdAt: 1 }).lean();
};

export const getAllExams = async () => {
  return Exam.find({}).sort({ order: 1, createdAt: 1 }).lean();
};

export const getExamById = async (examId) => {
  const id = validateObjectId(examId, "examId");
  const exam = await Exam.findById(id).lean();
  if (!exam) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");
  return exam;
};
