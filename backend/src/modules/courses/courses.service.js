import Course from "../../models/course.model.js";
import CourseSubject from "../../models/courseSubject.model.js";
import CourseChapter from "../../models/courseChapter.model.js";
import CourseNote from "../../models/courseNote.model.js";
import CourseVideo from "../../models/courseVideo.model.js";
import CourseAccess from "../../models/courseAccess.model.js";
import CourseProgress from "../../models/courseProgress.model.js";
import TopicAccess from "../../models/topicAccess.model.js";
import Exam from "../../models/exam.model.js";
import ExamCategory from "../../models/examCategory.model.js";
import Test from "../../models/test.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Multipart form fields arrive as strings; mappedTestSeries may be a JSON array
// string or an already-parsed array. Normalize to an array of ids.
function parseIdArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Ensure slug is unique by appending a counter when needed.
async function uniqueSlug(base) {
  let slug = slugify(base);
  let counter = 1;
  while (await Course.exists({ slug })) {
    slug = `${slugify(base)}-${counter++}`;
  }
  return slug;
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function createCourse(data, teacherId) {
  const { title, description, examId, isPaid, price, discountedPrice, tags, thumbnail, validityMonths, mappedTestSeries } = data;
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError(STATUS_CODES.NOT_FOUND, "Exam not found");

  const paid = Boolean(isPaid);
  const slug = await uniqueSlug(title);
  return Course.create({
    title,
    description,
    slug,
    examId,
    teacherId,
    isPaid: paid,
    price: paid ? Number(price) || 0 : 0,
    discountedPrice: paid ? Number(discountedPrice) || 0 : 0,
    validityMonths: Math.max(0, Number(validityMonths) || 0),
    mappedTestSeries: parseIdArray(mappedTestSeries),
    tags,
    thumbnail,
    status: ["draft", "published", "private", "hidden"].includes(data.status) ? data.status : "published",
  });
}

export async function updateCourse(courseId, data, teacherId) {
  const query = teacherId ? { _id: courseId, teacherId } : { _id: courseId };
  const course = await Course.findOne(query);
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const allowed = ["title", "description", "isPaid", "price", "discountedPrice", "tags", "status", "thumbnail", "order", "examId"];
  allowed.forEach((k) => {
    if (data[k] !== undefined) course[k] = data[k];
  });
  if (data.validityMonths !== undefined) course.validityMonths = Math.max(0, Number(data.validityMonths) || 0);
  if (data.mappedTestSeries !== undefined) course.mappedTestSeries = parseIdArray(data.mappedTestSeries);
  return course.save();
}

export async function deleteCourse(courseId, teacherId) {
  const query = teacherId ? { _id: courseId, teacherId } : { _id: courseId };
  const course = await Course.findOne(query);
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  // Cascade delete subjects → chapters → notes/videos
  const subjects = await CourseSubject.find({ courseId });
  const subjectIds = subjects.map((s) => s._id);
  const chapters = subjectIds.length
    ? await CourseChapter.find({ subjectId: { $in: subjectIds } })
    : [];
  const chapterIds = chapters.map((c) => c._id);

  if (chapterIds.length) {
    await CourseNote.deleteMany({ chapterId: { $in: chapterIds } });
    await CourseVideo.deleteMany({ chapterId: { $in: chapterIds } });
  }
  if (subjectIds.length) await CourseChapter.deleteMany({ subjectId: { $in: subjectIds } });
  await CourseSubject.deleteMany({ courseId });
  await CourseAccess.deleteMany({ courseId });
  await Course.deleteOne({ _id: courseId });
}

// Full hierarchy tree for a single course (admin/student).
export async function getCourseTree(courseId) {
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  const subjects = await CourseSubject.find({ courseId }).sort({ order: 1, createdAt: 1 }).lean();
  const subjectIds = subjects.map((s) => s._id);
  const chapters = subjectIds.length
    ? await CourseChapter.find({ subjectId: { $in: subjectIds } }).sort({ order: 1, createdAt: 1 }).lean()
    : [];
  const chapterIds = chapters.map((c) => c._id);

  const [notes, videos] = await Promise.all([
    chapterIds.length ? CourseNote.find({ chapterId: { $in: chapterIds } }).sort({ order: 1 }).lean() : [],
    chapterIds.length ? CourseVideo.find({ chapterId: { $in: chapterIds } }).sort({ order: 1 }).lean() : [],
  ]);

  // Gather test IDs for population
  const allLinkedTestIds = chapters.flatMap((ch) => ch.linkedTests?.map((lt) => lt.testId) ?? []);
  const tests = allLinkedTestIds.length
    ? await Test.find({ _id: { $in: allLinkedTestIds } }).select("title type duration totalMarks status").lean()
    : [];
  const testMap = new Map(tests.map((t) => [t._id.toString(), t]));

  const tree = {
    ...course,
    subjects: subjects.map((sub) => {
      const subChapters = chapters.filter((c) => String(c.subjectId) === String(sub._id));
      return {
        ...sub,
        chapters: subChapters.map((ch) => ({
          ...ch,
          notes: notes.filter((n) => String(n.chapterId) === String(ch._id)),
          videos: videos.filter((v) => String(v.chapterId) === String(ch._id)),
          linkedTests: (ch.linkedTests ?? []).map((lt) => ({
            ...lt,
            test: testMap.get(String(lt.testId)) || null,
          })),
        })),
      };
    }),
  };
  return tree;
}

// Lightweight list for admin sidebar/overview (no notes/videos content).
export async function getAdminCourseHierarchy(teacherId) {
  const categories = await ExamCategory.find({}).sort({ order: 1, createdAt: 1 }).lean();
  const exams = await Exam.find({}).sort({ order: 1, createdAt: 1 }).lean();
  const courses = await Course.find({ teacherId }).sort({ order: 1, createdAt: -1 }).lean();

  const courseIds = courses.map((c) => c._id);
  const subjects = courseIds.length
    ? await CourseSubject.find({ courseId: { $in: courseIds } }).sort({ order: 1 }).lean()
    : [];
  const subjectIds = subjects.map((s) => s._id);
  const chapters = subjectIds.length
    ? await CourseChapter.find({ subjectId: { $in: subjectIds } }).sort({ order: 1 }).lean()
    : [];

  // Count notes + videos per chapter
  const chapterIds = chapters.map((c) => c._id);
  const [noteCounts, videoCounts] = await Promise.all([
    chapterIds.length
      ? CourseNote.aggregate([{ $match: { chapterId: { $in: chapterIds } } }, { $group: { _id: "$chapterId", count: { $sum: 1 } } }])
      : [],
    chapterIds.length
      ? CourseVideo.aggregate([{ $match: { chapterId: { $in: chapterIds } } }, { $group: { _id: "$chapterId", count: { $sum: 1 } } }])
      : [],
  ]);

  const noteCountMap = new Map(noteCounts.map((r) => [r._id.toString(), r.count]));
  const videoCountMap = new Map(videoCounts.map((r) => [r._id.toString(), r.count]));

  const examsByCat = new Map();
  exams.forEach((e) => {
    const list = examsByCat.get(e.examCategoryId.toString()) || [];
    list.push(e);
    examsByCat.set(e.examCategoryId.toString(), list);
  });

  const coursesByExam = new Map();
  courses.forEach((c) => {
    const list = coursesByExam.get(c.examId.toString()) || [];
    list.push(c);
    coursesByExam.set(c.examId.toString(), list);
  });

  const subjectsByCourse = new Map();
  subjects.forEach((s) => {
    const list = subjectsByCourse.get(s.courseId.toString()) || [];
    list.push(s);
    subjectsByCourse.set(s.courseId.toString(), list);
  });

  const chaptersBySubject = new Map();
  chapters.forEach((ch) => {
    const list = chaptersBySubject.get(ch.subjectId.toString()) || [];
    list.push(ch);
    chaptersBySubject.set(ch.subjectId.toString(), list);
  });

  return categories.map((cat) => ({
    ...cat,
    exams: (examsByCat.get(cat._id.toString()) || []).map((exam) => ({
      ...exam,
      courses: (coursesByExam.get(exam._id.toString()) || []).map((course) => ({
        ...course,
        subjects: (subjectsByCourse.get(course._id.toString()) || []).map((sub) => ({
          ...sub,
          chapters: (chaptersBySubject.get(sub._id.toString()) || []).map((ch) => ({
            ...ch,
            notesCount: noteCountMap.get(ch._id.toString()) || 0,
            videosCount: videoCountMap.get(ch._id.toString()) || 0,
            testsCount: (ch.linkedTests || []).length,
          })),
        })),
      })),
    })),
  }));
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export async function createSubject(courseId, data, teacherId) {
  const course = await Course.findOne({ _id: courseId, teacherId });
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  const maxOrder = await CourseSubject.countDocuments({ courseId });
  return CourseSubject.create({ courseId, teacherId, title: data.title, description: data.description, order: maxOrder });
}

export async function updateSubject(subjectId, data, teacherId) {
  const sub = await CourseSubject.findOne({ _id: subjectId, teacherId });
  if (!sub) throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  if (data.title !== undefined) sub.title = data.title;
  if (data.description !== undefined) sub.description = data.description;
  if (data.order !== undefined) sub.order = data.order;
  return sub.save();
}

export async function deleteSubject(subjectId, teacherId) {
  const sub = await CourseSubject.findOne({ _id: subjectId, teacherId });
  if (!sub) throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  const chapters = await CourseChapter.find({ subjectId });
  const chapterIds = chapters.map((c) => c._id);
  if (chapterIds.length) {
    await CourseNote.deleteMany({ chapterId: { $in: chapterIds } });
    await CourseVideo.deleteMany({ chapterId: { $in: chapterIds } });
    await CourseChapter.deleteMany({ subjectId });
  }
  await CourseSubject.deleteOne({ _id: subjectId });
}

// ─── Chapters ───────────────────────────────────────────────────────────────

export async function createChapter(subjectId, data, teacherId) {
  const sub = await CourseSubject.findOne({ _id: subjectId, teacherId });
  if (!sub) throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  const maxOrder = await CourseChapter.countDocuments({ subjectId });
  return CourseChapter.create({ subjectId, teacherId, title: data.title, description: data.description, order: maxOrder });
}

export async function updateChapter(chapterId, data, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  if (data.title !== undefined) ch.title = data.title;
  if (data.description !== undefined) ch.description = data.description;
  if (data.order !== undefined) ch.order = data.order;
  return ch.save();
}

export async function deleteChapter(chapterId, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  await CourseNote.deleteMany({ chapterId });
  await CourseVideo.deleteMany({ chapterId });
  await CourseChapter.deleteOne({ _id: chapterId });
}

// Bulk drag-and-drop reorder: chapterIds is the full new order for this subject.
export async function reorderChapters(subjectId, chapterIds, teacherId) {
  if (!Array.isArray(chapterIds) || !chapterIds.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "chapterIds array is required");
  }
  const chapters = await CourseChapter.find({ subjectId, teacherId }).select("_id").lean();
  const validIds = new Set(chapters.map((c) => c._id.toString()));
  if (chapterIds.some((id) => !validIds.has(String(id))) || chapterIds.length !== chapters.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "chapterIds must match this subject's existing chapters");
  }
  await CourseChapter.bulkWrite(
    chapterIds.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }))
  );
  return CourseChapter.find({ subjectId }).sort({ order: 1 }).lean();
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function createNote(chapterId, data, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  const maxOrder = await CourseNote.countDocuments({ chapterId });

  if (data.type === "rich_text") {
    if (!data.content) throw new ApiError(STATUS_CODES.BAD_REQUEST, "Content is required for rich text notes");
    return CourseNote.create({ chapterId, teacherId, title: data.title, type: "rich_text", content: data.content, allowDownload: data.allowDownload ?? true, order: maxOrder });
  }

  if (data.type === "pdf") {
    if (!data.fileUrl) throw new ApiError(STATUS_CODES.BAD_REQUEST, "File URL is required for PDF notes");
    return CourseNote.create({ chapterId, teacherId, title: data.title, type: "pdf", fileUrl: data.fileUrl, filePublicId: data.filePublicId, fileName: data.fileName, allowDownload: data.allowDownload ?? true, order: maxOrder });
  }

  throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid note type");
}

export async function updateNote(noteId, data, teacherId) {
  const note = await CourseNote.findOne({ _id: noteId, teacherId });
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  const allowed = ["title", "content", "fileUrl", "filePublicId", "fileName", "allowDownload", "order"];
  allowed.forEach((k) => { if (data[k] !== undefined) note[k] = data[k]; });
  return note.save();
}

export async function deleteNote(noteId, teacherId) {
  const note = await CourseNote.findOne({ _id: noteId, teacherId });
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  await CourseNote.deleteOne({ _id: noteId });
}

export async function getNoteById(noteId) {
  const note = await CourseNote.findById(noteId).lean();
  if (!note) throw new ApiError(STATUS_CODES.NOT_FOUND, "Note not found");
  return note;
}

// ─── Videos ─────────────────────────────────────────────────────────────────

export async function createVideo(chapterId, data, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  if (!data.youtubeUrl) throw new ApiError(STATUS_CODES.BAD_REQUEST, "YouTube URL is required");
  const maxOrder = await CourseVideo.countDocuments({ chapterId });
  return CourseVideo.create({ chapterId, teacherId, title: data.title, youtubeUrl: data.youtubeUrl, description: data.description, order: maxOrder });
}

export async function updateVideo(videoId, data, teacherId) {
  const vid = await CourseVideo.findOne({ _id: videoId, teacherId });
  if (!vid) throw new ApiError(STATUS_CODES.NOT_FOUND, "Video not found");
  const allowed = ["title", "youtubeUrl", "description", "order"];
  allowed.forEach((k) => { if (data[k] !== undefined) vid[k] = data[k]; });
  return vid.save();
}

export async function deleteVideo(videoId, teacherId) {
  const vid = await CourseVideo.findOne({ _id: videoId, teacherId });
  if (!vid) throw new ApiError(STATUS_CODES.NOT_FOUND, "Video not found");
  await CourseVideo.deleteOne({ _id: videoId });
}

// ─── Linked Tests ────────────────────────────────────────────────────────────

export async function linkTest(chapterId, testId, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  const test = await Test.findById(testId);
  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");

  const alreadyLinked = ch.linkedTests.some((lt) => String(lt.testId) === String(testId));
  if (alreadyLinked) throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test already linked to this chapter");

  ch.linkedTests.push({ testId, order: ch.linkedTests.length });
  return ch.save();
}

export async function unlinkTest(chapterId, testId, teacherId) {
  const ch = await CourseChapter.findOne({ _id: chapterId, teacherId });
  if (!ch) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  ch.linkedTests = ch.linkedTests.filter((lt) => String(lt.testId) !== String(testId));
  return ch.save();
}

// ─── Access Control ──────────────────────────────────────────────────────────

export async function checkCourseAccess(userId, courseId) {
  const course = await Course.findById(courseId).select("isPaid").lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  if (!course.isPaid) return { hasAccess: true, reason: "free", expiresAt: null };

  const now = new Date();

  // Access is purely per-course: a non-disabled, non-expired grant unlocks it.
  // Otherwise the student must (re)pay for this specific course.
  const access = await CourseAccess.findOne({ userId, courseId }).lean();
  if (access && !access.disabled && (!access.expiresAt || access.expiresAt > now)) {
    return { hasAccess: true, reason: "purchased", expiresAt: access.expiresAt || null };
  }

  if (access && access.disabled) return { hasAccess: false, reason: "disabled", expiresAt: null };
  if (access && access.expiresAt && access.expiresAt <= now)
    return { hasAccess: false, reason: "expired", expiresAt: access.expiresAt };
  return { hasAccess: false, reason: "locked", expiresAt: null };
}

// True when `testId` is linked into a course the student currently has access
// to. This unlocks ONLY that linked test (not the rest of its test series) — the
// test still requires its own series purchase when reached outside the course.
export async function userCanAccessTestViaCourse(userId, testId) {
  if (!userId || !testId) return false;

  const chapters = await CourseChapter.find({ "linkedTests.testId": testId })
    .select("subjectId")
    .lean();
  if (!chapters.length) return false;

  const subjectIds = [...new Set(chapters.map((c) => String(c.subjectId)))];
  const subjects = await CourseSubject.find({ _id: { $in: subjectIds } })
    .select("courseId")
    .lean();
  const courseIds = [...new Set(subjects.map((s) => String(s.courseId)))];

  for (const courseId of courseIds) {
    try {
      const { hasAccess } = await checkCourseAccess(userId, courseId);
      if (hasAccess) return true;
    } catch {
      // Course deleted or invalid — skip and try the next one.
    }
  }
  return false;
}

export async function grantCourseAccess(userId, courseId, paymentId, expiresAt = null) {
  // Re-purchasing resets the access window and clears any admin-revoked state.
  const access = await CourseAccess.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        paymentId,
        purchasedAt: new Date(),
        expiresAt: expiresAt || null,
        disabled: false,
        disabledAt: null,
        status: "ACTIVE",
      },
    },
    { upsert: true, new: true }
  );

  // Auto-unlock any test series mapped to this course, inheriting its expiry.
  await cascadeUnlockMappedSeries(userId, courseId, expiresAt || null, paymentId);

  return access;
}

/**
 * Unlock every test series (topic) mapped to a course for a user, inheriting
 * the course's access window. A series the user already bought DIRECTLY is left
 * untouched so its independent validity is preserved. COURSE_UNLOCK rows are
 * upserted/refreshed so re-purchasing the course re-extends them.
 */
export async function cascadeUnlockMappedSeries(userId, courseId, expiresAt = null, paymentId = null) {
  const course = await Course.findById(courseId).select("mappedTestSeries").lean();
  const topicIds = course?.mappedTestSeries || [];
  if (!topicIds.length) return;

  for (const topicId of topicIds) {
    const existing = await TopicAccess.findOne({ userId, topicId });

    // A direct purchase always wins — never downgrade or overwrite it.
    if (existing && existing.source === "DIRECT_PURCHASE") continue;

    await TopicAccess.findOneAndUpdate(
      { userId, topicId },
      {
        $set: {
          source: "COURSE_UNLOCK",
          sourceCourseId: courseId,
          expiresAt: expiresAt || null,
          disabled: false,
          disabledAt: null,
          status: "ACTIVE",
          paymentId: paymentId || null,
        },
        $setOnInsert: { amount: 0, currency: "INR" },
      },
      { upsert: true, new: true }
    );
  }
}

/**
 * Propagate a course-access change to every COURSE_UNLOCK test series it
 * unlocked: when a course is disabled or its expiry changes, the linked series
 * follow. Direct purchases are never touched.
 */
export async function syncMappedSeriesToCourse(userId, courseId, { disabled, expiresAt } = {}) {
  const set = {};
  if (disabled !== undefined) {
    set.disabled = Boolean(disabled);
    set.disabledAt = disabled ? new Date() : null;
  }
  if (expiresAt !== undefined) set.expiresAt = expiresAt || null;
  if (!Object.keys(set).length) return;

  await TopicAccess.updateMany(
    { userId, sourceCourseId: courseId, source: "COURSE_UNLOCK" },
    { $set: set }
  );
}

// ─── Public ──────────────────────────────────────────────────────────────────

// Returns courses grouped by ExamCategory → Exam for the public website.
export async function getPublicCourseHierarchy(limit = 20, examId = null) {
  const filter = { status: "published" };
  if (examId) filter.examId = examId;

  const rawCourses = await Course.find(filter).sort({ order: 1, createdAt: -1 }).lean();

  // Exclude orphans whose exam was deleted so they don't surface to students.
  const examIds = [...new Set(rawCourses.map((c) => String(c.examId)).filter(Boolean))];
  const visibleCategories = await ExamCategory.find({ isVisible: { $ne: false } }).select("_id").lean();
  const visibleCategoryIds = visibleCategories.map((category) => category._id);
  const existingExams = examIds.length
    ? await Exam.find({
        _id: { $in: examIds },
        examCategoryId: { $in: visibleCategoryIds },
      }).select("_id").lean()
    : [];
  const liveExamIds = new Set(existingExams.map((e) => String(e._id)));
  const courses = rawCourses
    .filter((c) => !c.examId || liveExamIds.has(String(c.examId)))
    .slice(0, limit);

  const courseIds = courses.map((c) => c._id);

  // Count subjects per course
  const subjectCounts = courseIds.length
    ? await CourseSubject.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ])
    : [];
  const subjectCountMap = new Map(subjectCounts.map((r) => [r._id.toString(), r.count]));

  return courses.map((c) => ({
    _id: c._id,
    title: c.title,
    description: c.description,
    slug: c.slug,
    examId: c.examId,
    isPaid: c.isPaid,
    price: c.price,
    discountedPrice: c.discountedPrice,
    validityMonths: c.validityMonths || 0,
    thumbnail: c.thumbnail,
    tags: c.tags,
    subjectsCount: subjectCountMap.get(c._id.toString()) || 0,
  }));
}

// Student-facing: list courses available to a student for a given exam.
export async function getStudentCourses(examId) {
  return Course.find({ examId }).sort({ order: 1, createdAt: -1 }).lean();
}

// ─── Progress ─────────────────────────────────────────────────────────────────

// Returns total chapter count + completed chapter IDs for a course/user.
export async function getCourseProgress(userId, courseId) {
  const course = await Course.findById(courseId).select("_id").lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  // Count total chapters in this course.
  const subjects = await CourseSubject.find({ courseId }).select("_id").lean();
  const subjectIds = subjects.map((s) => s._id);
  const totalChapters = subjectIds.length
    ? await CourseChapter.countDocuments({ subjectId: { $in: subjectIds } })
    : 0;

  const completed = await CourseProgress.find({ userId, courseId }).select("chapterId completedAt").lean();
  const completedChapterIds = completed.map((p) => String(p.chapterId));
  const completedCount = completed.length;
  const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return { completedChapterIds, totalChapters, completedCount, percentage };
}

export async function markChapterComplete(userId, chapterId) {
  const chapter = await CourseChapter.findById(chapterId).select("subjectId").lean();
  if (!chapter) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");

  const subject = await CourseSubject.findById(chapter.subjectId).select("courseId").lean();
  const courseId = subject?.courseId;

  await CourseProgress.findOneAndUpdate(
    { userId, chapterId },
    { $set: { courseId, completedAt: new Date() } },
    { upsert: true }
  );
  return getCourseProgress(userId, courseId);
}

export async function unmarkChapterComplete(userId, chapterId) {
  const chapter = await CourseChapter.findById(chapterId).select("subjectId").lean();
  if (!chapter) throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");

  const subject = await CourseSubject.findById(chapter.subjectId).select("courseId").lean();
  await CourseProgress.deleteOne({ userId, chapterId });
  return getCourseProgress(userId, subject?.courseId);
}

// Bulk progress for a list of course IDs (for StudentCourses browse page).
export async function getBulkCourseProgress(userId, courseIds) {
  if (!courseIds?.length) return {};

  const [subjects, completedAll] = await Promise.all([
    CourseSubject.find({ courseId: { $in: courseIds } }).select("_id courseId").lean(),
    CourseProgress.find({ userId, courseId: { $in: courseIds } }).select("courseId").lean(),
  ]);

  const subjectIds = subjects.map((s) => s._id);
  const chapters = subjectIds.length
    ? await CourseChapter.find({ subjectId: { $in: subjectIds } }).select("_id subjectId").lean()
    : [];

  // Build courseId → totalChapters map
  const subjectToCourse = new Map(subjects.map((s) => [String(s._id), String(s.courseId)]));
  const totalByCoursId = {};
  chapters.forEach((ch) => {
    const cid = subjectToCourse.get(String(ch.subjectId));
    if (cid) totalByCoursId[cid] = (totalByCoursId[cid] || 0) + 1;
  });

  // Build courseId → completedCount map
  const completedByCourseId = {};
  completedAll.forEach((p) => {
    const cid = String(p.courseId);
    completedByCourseId[cid] = (completedByCourseId[cid] || 0) + 1;
  });

  const result = {};
  courseIds.forEach((id) => {
    const cid = String(id);
    const total = totalByCoursId[cid] || 0;
    const done = completedByCourseId[cid] || 0;
    result[cid] = {
      totalChapters: total,
      completedCount: done,
      percentage: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
  return result;
}
