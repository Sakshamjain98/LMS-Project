import Note from "../../models/note.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

export const createNote = async (data, teacherId) => {
  return Note.create({ ...data, teacherId });
};

export const getNotesByTeacher = async (teacherId) => {
  return Note.find({ teacherId }).sort({ createdAt: -1 }).lean();
};

export const getNoteById = async (noteId, teacherId) => {
  const note = await Note.findOne({ _id: noteId, teacherId }).lean();
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  return note;
};

export const updateNote = async (noteId, teacherId, updateData) => {
  const note = await Note.findOneAndUpdate(
    { _id: noteId, teacherId },
    { $set: updateData },
    { new: true }
  );
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  return note;
};

export const deleteNote = async (noteId, teacherId) => {
  const note = await Note.findOneAndDelete({ _id: noteId, teacherId });
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  return note;
};