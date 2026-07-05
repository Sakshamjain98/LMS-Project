import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import * as service from "./examCategory.service.js";

export const getAll = asyncHandler(async (_req, res) => {
  const categories = await service.getAllCategories();
  res.status(STATUS_CODES.SUCCESS).json({ success: true, categories });
});

export const getById = asyncHandler(async (req, res) => {
  const category = await service.getCategoryById(req.params.categoryId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, category });
});

export const create = asyncHandler(async (req, res) => {
  const category = await service.createCategory(req.body);
  res.status(STATUS_CODES.CREATED).json({ success: true, message: "Category created", category });
});

export const update = asyncHandler(async (req, res) => {
  const category = await service.updateCategory(req.params.categoryId, req.body);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Category updated", category });
});

export const reorder = asyncHandler(async (req, res) => {
  const categories = await service.reorderCategories(req.body.categoryIds);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, categories });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.categoryId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Category deleted" });
});
