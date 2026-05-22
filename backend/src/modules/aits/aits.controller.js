import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import * as service from "./aits.service.js";

export const getByExam = asyncHandler(async (req, res) => {
  const teacherId = req.user.role === "admin" ? null : req.user._id;
  const aitsList = await service.getAITSByExam(req.params.examId, teacherId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, aitsList });
});

export const create = asyncHandler(async (req, res) => {
  const aits = await service.createAITS(req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, message: "AITS created", aits });
});

export const update = asyncHandler(async (req, res) => {
  const aits = await service.updateAITS(req.params.aitsId, req.body, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "AITS updated", aits });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteAITS(req.params.aitsId, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "AITS deleted" });
});

export const createTest = asyncHandler(async (req, res) => {
  const test = await service.createAITSTest(req.params.aitsId, req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({ success: true, message: "AITS test created", test });
});
