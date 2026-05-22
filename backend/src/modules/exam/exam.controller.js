import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import * as service from "./exam.service.js";

export const getAll = asyncHandler(async (req, res) => {
  const exams = req.query.categoryId
    ? await service.getExamsByCategory(req.query.categoryId)
    : await service.getAllExams();
  res.status(STATUS_CODES.SUCCESS).json({ success: true, exams });
});

export const getById = asyncHandler(async (req, res) => {
  const exam = await service.getExamById(req.params.examId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, exam });
});

export const create = asyncHandler(async (req, res) => {
  const exam = await service.createExam(req.body);
  res.status(STATUS_CODES.CREATED).json({ success: true, message: "Exam created", exam });
});

export const update = asyncHandler(async (req, res) => {
  const exam = await service.updateExam(req.params.examId, req.body);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Exam updated", exam });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteExam(req.params.examId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Exam deleted" });
});
