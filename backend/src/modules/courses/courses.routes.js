import express from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import * as svc from "./courses.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import mongoose from "mongoose";

const router = express.Router();

// ─── Public ──────────────────────────────────────────────────────────────────

// GET /api/courses/public?examId=&limit=
router.get(
  "/public",
  asyncHandler(async (req, res) => {
    const { examId, limit = 12 } = req.query;
    const courses = await svc.getPublicCourseHierarchy(Math.min(parseInt(limit, 10) || 12, 50), examId || null);
    res.json({ success: true, courses });
  })
);

// GET /api/courses/:courseId/public — public course overview (no note content)
router.get(
  "/:courseId/public",
  asyncHandler(async (req, res) => {
    const tree = await svc.getCourseTree(req.params.courseId);
    // Strip full note content from public view (only titles)
    const stripped = {
      ...tree,
      subjects: tree.subjects.map((sub) => ({
        ...sub,
        chapters: sub.chapters.map((ch) => ({
          ...ch,
          notes: ch.notes.map(({ content: _c, fileUrl: _f, ...rest }) => rest),
        })),
      })),
    };
    res.json({ success: true, course: stripped });
  })
);

// ─── Admin / Teacher ─────────────────────────────────────────────────────────

router.use(authMiddleware);

// GET /api/courses/admin/hierarchy — full admin tree
router.get(
  "/admin/hierarchy",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const hierarchy = await svc.getAdminCourseHierarchy(req.user._id);
    res.json({ success: true, hierarchy });
  })
);

// GET /api/courses/admin/:courseId/full — full course tree for admin (no access check)
router.get(
  "/admin/:courseId/full",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const tree = await svc.getCourseTree(req.params.courseId);
    res.json({ success: true, course: tree });
  })
);

// POST /api/courses — create course
router.post(
  "/",
  authorize("teacher", "admin"),
  upload.single("thumbnail"),
  asyncHandler(async (req, res) => {
    const thumbnail = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : req.body.thumbnail;
    const course = await svc.createCourse({ ...req.body, thumbnail }, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, course });
  })
);

// PATCH /api/courses/:courseId — update course
router.patch(
  "/:courseId",
  authorize("teacher", "admin"),
  upload.single("thumbnail"),
  asyncHandler(async (req, res) => {
    const thumbnail = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : req.body.thumbnail !== undefined ? req.body.thumbnail : undefined;
    const data = { ...req.body };
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    const teacherId = req.user.role === "admin" ? null : req.user._id;
    const course = await svc.updateCourse(req.params.courseId, data, teacherId);
    res.json({ success: true, course });
  })
);

// DELETE /api/courses/:courseId
router.delete(
  "/:courseId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const teacherId = req.user.role === "admin" ? null : req.user._id;
    await svc.deleteCourse(req.params.courseId, teacherId);
    res.json({ success: true, message: "Course deleted" });
  })
);

// GET /api/courses/:courseId/tree — full course tree (auth required)
router.get(
  "/:courseId/tree",
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { courseId } = req.params;
    const { hasAccess } = await svc.checkCourseAccess(userId, courseId);

    const tree = await svc.getCourseTree(courseId);

    if (!hasAccess) {
      // Return tree with note content stripped (preview mode)
      const preview = {
        ...tree,
        locked: true,
        subjects: tree.subjects.slice(0, 1).map((sub) => ({
          ...sub,
          chapters: sub.chapters.slice(0, 1).map((ch) => ({
            ...ch,
            notes: ch.notes.map(({ content: _c, fileUrl: _f, ...rest }) => ({ ...rest, locked: true })),
            videos: ch.videos.map(({ youtubeUrl: _u, ...rest }) => ({ ...rest, locked: true })),
          })),
        })),
      };
      return res.json({ success: true, course: preview, hasAccess: false });
    }
    res.json({ success: true, course: tree, hasAccess: true });
  })
);

// GET /api/courses/:courseId/access — check if student has access
router.get(
  "/:courseId/access",
  asyncHandler(async (req, res) => {
    const result = await svc.checkCourseAccess(req.user._id, req.params.courseId);
    res.json({ success: true, ...result });
  })
);

// ─── Subjects ────────────────────────────────────────────────────────────────

// POST /api/courses/:courseId/subjects
router.post(
  "/:courseId/subjects",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const sub = await svc.createSubject(req.params.courseId, req.body, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, subject: sub });
  })
);

// PATCH /api/courses/subjects/:subjectId
router.patch(
  "/subjects/:subjectId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const sub = await svc.updateSubject(req.params.subjectId, req.body, req.user._id);
    res.json({ success: true, subject: sub });
  })
);

// DELETE /api/courses/subjects/:subjectId
router.delete(
  "/subjects/:subjectId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    await svc.deleteSubject(req.params.subjectId, req.user._id);
    res.json({ success: true, message: "Subject deleted" });
  })
);

// ─── Chapters ────────────────────────────────────────────────────────────────

// POST /api/courses/subjects/:subjectId/chapters
router.post(
  "/subjects/:subjectId/chapters",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const ch = await svc.createChapter(req.params.subjectId, req.body, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, chapter: ch });
  })
);

// PATCH /api/courses/chapters/:chapterId
router.patch(
  "/chapters/:chapterId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const ch = await svc.updateChapter(req.params.chapterId, req.body, req.user._id);
    res.json({ success: true, chapter: ch });
  })
);

// DELETE /api/courses/chapters/:chapterId
router.delete(
  "/chapters/:chapterId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    await svc.deleteChapter(req.params.chapterId, req.user._id);
    res.json({ success: true, message: "Chapter deleted" });
  })
);

// ─── Notes ───────────────────────────────────────────────────────────────────

// POST /api/courses/chapters/:chapterId/notes
// For PDF: multipart with `file` field; for rich_text: JSON body
router.post(
  "/chapters/:chapterId/notes",
  authorize("teacher", "admin"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (req.file) {
      data.type = "pdf";
      data.fileUrl = req.file.path;
      data.filePublicId = req.file.filename;
      data.fileName = req.file.originalname;
    }
    const note = await svc.createNote(req.params.chapterId, data, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, note });
  })
);

// PATCH /api/courses/notes/:noteId
router.patch(
  "/notes/:noteId",
  authorize("teacher", "admin"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (req.file) {
      data.fileUrl = req.file.path;
      data.filePublicId = req.file.filename;
      data.fileName = req.file.originalname;
    }
    const note = await svc.updateNote(req.params.noteId, data, req.user._id);
    res.json({ success: true, note });
  })
);

// DELETE /api/courses/notes/:noteId
router.delete(
  "/notes/:noteId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    await svc.deleteNote(req.params.noteId, req.user._id);
    res.json({ success: true, message: "Note deleted" });
  })
);

// GET /api/courses/notes/:noteId — student reads a note
router.get(
  "/notes/:noteId",
  asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const note = await svc.getNoteById(noteId);

    // Access check: get chapterId → subjectId → courseId
    const CourseChapter = (await import("../../models/courseChapter.model.js")).default;
    const CourseSubject = (await import("../../models/courseSubject.model.js")).default;
    const chapter = await CourseChapter.findById(note.chapterId).select("subjectId").lean();
    const subject = await CourseSubject.findById(chapter?.subjectId).select("courseId").lean();
    if (subject) {
      const { hasAccess } = await svc.checkCourseAccess(req.user._id, subject.courseId);
      if (!hasAccess) {
        return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, message: "Course access required" });
      }
    }
    res.json({ success: true, note });
  })
);

// ─── Videos ──────────────────────────────────────────────────────────────────

// POST /api/courses/chapters/:chapterId/videos
router.post(
  "/chapters/:chapterId/videos",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const vid = await svc.createVideo(req.params.chapterId, req.body, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, video: vid });
  })
);

// PATCH /api/courses/videos/:videoId
router.patch(
  "/videos/:videoId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const vid = await svc.updateVideo(req.params.videoId, req.body, req.user._id);
    res.json({ success: true, video: vid });
  })
);

// DELETE /api/courses/videos/:videoId
router.delete(
  "/videos/:videoId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    await svc.deleteVideo(req.params.videoId, req.user._id);
    res.json({ success: true, message: "Video deleted" });
  })
);

// ─── Linked Tests ─────────────────────────────────────────────────────────────

// POST /api/courses/chapters/:chapterId/tests
router.post(
  "/chapters/:chapterId/tests",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const ch = await svc.linkTest(req.params.chapterId, req.body.testId, req.user._id);
    res.status(STATUS_CODES.CREATED).json({ success: true, chapter: ch });
  })
);

// DELETE /api/courses/chapters/:chapterId/tests/:testId
router.delete(
  "/chapters/:chapterId/tests/:testId",
  authorize("teacher", "admin"),
  asyncHandler(async (req, res) => {
    const ch = await svc.unlinkTest(req.params.chapterId, req.params.testId, req.user._id);
    res.json({ success: true, chapter: ch });
  })
);

// ─── Progress ─────────────────────────────────────────────────────────────────

// GET /api/courses/:courseId/progress
router.get(
  "/:courseId/progress",
  asyncHandler(async (req, res) => {
    const progress = await svc.getCourseProgress(req.user._id, req.params.courseId);
    res.json({ success: true, ...progress });
  })
);

// POST /api/courses/chapters/:chapterId/complete
router.post(
  "/chapters/:chapterId/complete",
  asyncHandler(async (req, res) => {
    const progress = await svc.markChapterComplete(req.user._id, req.params.chapterId);
    res.json({ success: true, ...progress });
  })
);

// DELETE /api/courses/chapters/:chapterId/complete
router.delete(
  "/chapters/:chapterId/complete",
  asyncHandler(async (req, res) => {
    const progress = await svc.unmarkChapterComplete(req.user._id, req.params.chapterId);
    res.json({ success: true, ...progress });
  })
);

// POST /api/courses/progress/bulk
router.post(
  "/progress/bulk",
  asyncHandler(async (req, res) => {
    const { courseIds = [] } = req.body;
    const validIds = courseIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const progress = await svc.getBulkCourseProgress(req.user._id, validIds);
    res.json({ success: true, progress });
  })
);

export default router;
