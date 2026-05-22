import express from "express";
import * as adminService from "../admin/admin.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import News from "../../models/news.model.js";
import Blog from "../../models/blog.model.js";
import ExamCategory from "../../models/examCategory.model.js";
import Exam from "../../models/exam.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import TestSeriesSubject from "../../models/testSeriesSubject.model.js";
import TestSeriesChapter from "../../models/testSeriesChapter.model.js";
import Test from "../../models/test.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

const router = express.Router();

// Public site content for the landing page (CMS-managed by admin).
router.get(
  "/site-content",
  asyncHandler(async (_req, res) => {
    const data = await adminService.getSiteContent();
    res.json({ success: true, data });
  })
);

// Public single-article page used by the "Read More" route.
router.get(
  "/blogs/:id",
  asyncHandler(async (req, res) => {
    const blog = await Blog.findOne({ _id: req.params.id, published: true }).lean();
    if (!blog) throw new ApiError(STATUS_CODES.NOT_FOUND, "Article not found");
    res.json({ success: true, blog });
  })
);

// Public list of test series (topics) for the landing-page highlights — actual DB content.
router.get(
  "/test-series",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 50);
    const filter = {};
    if (req.query.examId) filter.examId = req.query.examId;
    const topics = await TestSeriesTopic.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    if (topics.length === 0) {
      return res.json({ success: true, topics: [] });
    }
    const topicIds = topics.map((t) => t._id);
    const subjects = await TestSeriesSubject.find({ topicId: { $in: topicIds } }).lean();
    const subjectIds = subjects.map((s) => s._id);
    const chapters = subjectIds.length
      ? await TestSeriesChapter.find({ subjectId: { $in: subjectIds } }).lean()
      : [];
    const chapterIds = chapters.map((c) => c._id);
    const tests = chapterIds.length
      ? await Test.find({ chapterId: { $in: chapterIds }, status: "published" })
          .select("chapterId duration")
          .lean()
      : [];

    // Flatten counts by topic for the landing UI.
    const out = topics.map((topic) => {
      const topicSubjects = subjects.filter((s) => String(s.topicId) === String(topic._id));
      const topicSubjectIds = new Set(topicSubjects.map((s) => String(s._id)));
      const topicChapters = chapters.filter((c) => topicSubjectIds.has(String(c.subjectId)));
      const topicChapterIds = new Set(topicChapters.map((c) => String(c._id)));
      const topicTests = tests.filter((t) => topicChapterIds.has(String(t.chapterId)));
      const totalDurationMin = topicTests.reduce((sum, t) => sum + (t.duration || 0), 0);
      return {
        _id: topic._id,
        title: topic.title,
        description: topic.description,
        isPaid: Boolean(topic.isPaid),
        price: Number(topic.price) || 0,
        subjectsCount: topicSubjects.length,
        chaptersCount: topicChapters.length,
        testsCount: topicTests.length,
        totalDurationMin,
      };
    });

    res.json({ success: true, topics: out });
  })
);


// Public exam categories with exam list + series counts (for landing page navigation).
router.get(
  "/exam-categories",
  asyncHandler(async (_req, res) => {
    const categories = await ExamCategory.find({}).sort({ order: 1, createdAt: 1 }).lean();
    if (!categories.length) return res.json({ success: true, categories: [] });

    const exams = await Exam.find({ examCategoryId: { $in: categories.map((c) => c._id) } })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Attach series count per exam so cards can display it without a second request.
    const examIds = exams.map((e) => e._id);
    const seriesCounts = await TestSeriesTopic.aggregate([
      { $match: { examId: { $in: examIds } } },
      { $group: { _id: "$examId", count: { $sum: 1 } } },
    ]);
    const countByExam = new Map(seriesCounts.map((r) => [r._id.toString(), r.count]));

    const examsByCat = new Map();
    exams.forEach((e) => {
      const list = examsByCat.get(e.examCategoryId.toString()) || [];
      list.push({ ...e, seriesCount: countByExam.get(e._id.toString()) || 0 });
      examsByCat.set(e.examCategoryId.toString(), list);
    });

    res.json({
      success: true,
      categories: categories.map((c) => ({
        ...c,
        exams: examsByCat.get(c._id.toString()) || [],
      })),
    });
  })
);

// Public list of published blogs/articles for the landing page
router.get(
  "/blogs",
  asyncHandler(async (req, res) => {
    const result = await adminService.getBlogs({
      published: true,
      limit: req.query.limit || 12,
      page: req.query.page || 1,
    });
    res.json({ success: true, ...result });
  })
);

// Public list of published news for the landing page
router.get(
  "/news",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 50);
    const news = await News.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, news });
  })
);

export default router;
