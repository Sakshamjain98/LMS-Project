import mongoose from "mongoose";
import ExamCategory from "../../models/examCategory.model.js";
import Exam from "../../models/exam.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

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
    const existing = await ExamCategory.findOne(query).lean();
    if (!existing) return candidate;
    candidate = `${slug}-${i++}`;
  }
};

export const createCategory = async (payload) => {
  const title = (payload?.title || "").toString().trim();
  if (!title || title.length < 2)
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 2 characters");

  const slug = await uniqueSlug(title);
  return ExamCategory.create({
    title: title.slice(0, 120),
    description: (payload?.description || "").toString().trim().slice(0, 1000),
    slug,
    order: Number(payload?.order) || 0,
  });
};

export const updateCategory = async (categoryId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId))
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid categoryId");

  const updates = {};
  if (payload?.title !== undefined) {
    const title = payload.title.toString().trim();
    if (!title || title.length < 2)
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 2 characters");
    updates.title = title.slice(0, 120);
    updates.slug = await uniqueSlug(title, categoryId);
  }
  if (payload?.description !== undefined)
    updates.description = payload.description.toString().trim().slice(0, 1000);
  if (payload?.order !== undefined) updates.order = Number(payload.order) || 0;

  const updated = await ExamCategory.findByIdAndUpdate(
    categoryId,
    { $set: updates },
    { new: true }
  ).lean();
  if (!updated) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam category not found");
  return updated;
};

export const deleteCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId))
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid categoryId");

  const examCount = await Exam.countDocuments({ examCategoryId: categoryId });
  if (examCount > 0)
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Cannot delete — ${examCount} exam(s) exist under this category. Delete them first.`
    );

  const deleted = await ExamCategory.findByIdAndDelete(categoryId);
  if (!deleted) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam category not found");
  return deleted;
};

export const getAllCategories = async () => {
  const categories = await ExamCategory.find({}).sort({ order: 1, createdAt: 1 }).lean();
  if (!categories.length) return [];

  const categoryIds = categories.map((c) => c._id);
  const exams = await Exam.find({ examCategoryId: { $in: categoryIds } })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const examsByCat = new Map();
  exams.forEach((e) => {
    const list = examsByCat.get(e.examCategoryId.toString()) || [];
    list.push(e);
    examsByCat.set(e.examCategoryId.toString(), list);
  });

  return categories.map((cat) => ({
    ...cat,
    exams: examsByCat.get(cat._id.toString()) || [],
  }));
};

export const getCategoryById = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId))
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid categoryId");
  const cat = await ExamCategory.findById(categoryId).lean();
  if (!cat) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam category not found");
  return cat;
};
