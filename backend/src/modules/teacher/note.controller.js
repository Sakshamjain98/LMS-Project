import * as service from "./note.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";

export const createNote = asyncHandler(async (req, res) => {
  const { title, description, isFree, tags } = req.body;
  const file = req.file;
  if (!file) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Note file is required");
  }

  const noteData = {
    title,
    description,
    isFree: isFree === "true" || isFree === true,
    tags: tags ? tags.split(",").map(t => t.trim()) : [],
    file: {
      url: file.path,
      publicId: file.filename,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "other",
    },
  };

  const note = await service.createNote(noteData, req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Note created successfully",
    note,
  });
});

export const getMyNotes = asyncHandler(async (req, res) => {
  const notes = await service.getNotesByTeacher(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    notes,
  });
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await service.getNoteById(req.params.id, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    note,
  });
});

export const updateNote = asyncHandler(async (req, res) => {
  const { title, description, isFree, tags } = req.body;
  const file = req.file;

  const updateData = {
    title,
    description,
    isFree: isFree === "true" || isFree === true,
    tags: tags ? tags.split(",").map(t => t.trim()) : [],
  };

  if (file) {
    updateData.file = {
      url: file.path,
      publicId: file.filename,
      fileType: file.mimetype === "application/pdf" ? "pdf" : "other",
    };
  }

  const note = await service.updateNote(req.params.id, req.user._id, updateData);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Note updated successfully",
    note,
  });
});

export const deleteNote = asyncHandler(async (req, res) => {
  await service.deleteNote(req.params.id, req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Note deleted successfully",
  });
});