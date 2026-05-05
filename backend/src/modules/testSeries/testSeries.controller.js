import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import * as seriesService from "./testSeries.service.js";
import * as testService from "../test/test.service.js";

export const getSeriesTree = asyncHandler(async (req, res) => {
  const topics = await seriesService.getTeacherSeriesTree(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    topics,
  });
});

export const createTopic = asyncHandler(async (req, res) => {
  const topic = await seriesService.createTopic(req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Topic created",
    topic,
  });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const topic = await seriesService.updateTopic(req.params.topicId, req.body, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Topic updated",
    topic,
  });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  await seriesService.deleteTopic(req.params.topicId, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Topic deleted",
  });
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await seriesService.createSubject(req.params.topicId, req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Subject created",
    subject,
  });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await seriesService.updateSubject(req.params.subjectId, req.body, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Subject updated",
    subject,
  });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await seriesService.deleteSubject(req.params.subjectId, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Subject deleted",
  });
});

export const createChapter = asyncHandler(async (req, res) => {
  const chapter = await seriesService.createChapter(req.params.subjectId, req.body, req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Chapter created",
    chapter,
  });
});

export const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await seriesService.updateChapter(req.params.chapterId, req.body, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Chapter updated",
    chapter,
  });
});

export const deleteChapter = asyncHandler(async (req, res) => {
  await seriesService.deleteChapter(req.params.chapterId, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Chapter deleted",
  });
});

export const createTestInChapter = asyncHandler(async (req, res) => {
  const test = await testService.createTest(
    { ...req.body, chapterId: req.params.chapterId },
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Test created",
    test,
  });
});
