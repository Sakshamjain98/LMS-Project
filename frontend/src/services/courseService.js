import api from "./api";

// ─── Public (no auth) ────────────────────────────────────────────────────────

export const getPublicCourses = async (limit = 8, examId = null) => {
  try {
    const params = { limit };
    if (examId) params.examId = examId;
    const res = await api.get("/public/courses", { params });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch courses" };
  }
};

export const getPublicCourseTree = async (courseId) => {
  try {
    const res = await api.get(`/courses/${courseId}/public`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch course" };
  }
};

// ─── Admin / Teacher ─────────────────────────────────────────────────────────

export const getAdminCourseHierarchy = async () => {
  try {
    const res = await api.get("/courses/admin/hierarchy");
    return res.data.hierarchy;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch course hierarchy" };
  }
};

export const getAdminCourseTree = async (courseId) => {
  try {
    const res = await api.get(`/courses/admin/${courseId}/full`);
    return res.data.course;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch course tree" };
  }
};

export const createCourse = async (formData) => {
  try {
    // Do NOT set Content-Type manually — axios reads the FormData boundary and sets it automatically.
    const res = await api.post("/courses", formData);
    return res.data.course;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create course" };
  }
};

export const updateCourse = async (courseId, formData) => {
  try {
    const res = await api.patch(`/courses/${courseId}`, formData);
    return res.data.course;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to update course" };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const res = await api.delete(`/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to delete course" };
  }
};

// ─── Subjects ────────────────────────────────────────────────────────────────

export const createSubject = async (courseId, data) => {
  try {
    const res = await api.post(`/courses/${courseId}/subjects`, data);
    return res.data.subject;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create subject" };
  }
};

export const updateSubject = async (subjectId, data) => {
  try {
    const res = await api.patch(`/courses/subjects/${subjectId}`, data);
    return res.data.subject;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to update subject" };
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    const res = await api.delete(`/courses/subjects/${subjectId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to delete subject" };
  }
};

// ─── Chapters ────────────────────────────────────────────────────────────────

export const createChapter = async (subjectId, data) => {
  try {
    const res = await api.post(`/courses/subjects/${subjectId}/chapters`, data);
    return res.data.chapter;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create chapter" };
  }
};

export const updateChapter = async (chapterId, data) => {
  try {
    const res = await api.patch(`/courses/chapters/${chapterId}`, data);
    return res.data.chapter;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to update chapter" };
  }
};

export const deleteChapter = async (chapterId) => {
  try {
    const res = await api.delete(`/courses/chapters/${chapterId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to delete chapter" };
  }
};

export const reorderChapters = async (subjectId, chapterIds) => {
  try {
    const res = await api.patch(`/courses/subjects/${subjectId}/chapters/reorder`, { chapterIds });
    return res.data.chapters;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to reorder chapters" };
  }
};

// ─── Notes ───────────────────────────────────────────────────────────────────

export const createRichTextNote = async (chapterId, data) => {
  try {
    const res = await api.post(`/courses/chapters/${chapterId}/notes`, {
      type: "rich_text",
      ...data,
    });
    return res.data.note;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create note" };
  }
};

export const createPdfNote = async (chapterId, formData) => {
  try {
    const res = await api.post(`/courses/chapters/${chapterId}/notes`, formData);
    return res.data.note;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to upload PDF" };
  }
};

export const updateNote = async (noteId, data) => {
  try {
    // axios automatically sets the correct Content-Type (with boundary) for FormData.
    const res = await api.patch(`/courses/notes/${noteId}`, data);
    return res.data.note;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to update note" };
  }
};

export const deleteNote = async (noteId) => {
  try {
    const res = await api.delete(`/courses/notes/${noteId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to delete note" };
  }
};

export const getNoteById = async (noteId) => {
  try {
    const res = await api.get(`/courses/notes/${noteId}`);
    return res.data.note;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch note" };
  }
};

// ─── Videos ──────────────────────────────────────────────────────────────────

export const createVideo = async (chapterId, data) => {
  try {
    const res = await api.post(`/courses/chapters/${chapterId}/videos`, data);
    return res.data.video;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create video" };
  }
};

export const updateVideo = async (videoId, data) => {
  try {
    const res = await api.patch(`/courses/videos/${videoId}`, data);
    return res.data.video;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to update video" };
  }
};

export const deleteVideo = async (videoId) => {
  try {
    const res = await api.delete(`/courses/videos/${videoId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to delete video" };
  }
};

// ─── Linked Tests ─────────────────────────────────────────────────────────────

export const linkTestToChapter = async (chapterId, testId) => {
  try {
    const res = await api.post(`/courses/chapters/${chapterId}/tests`, { testId });
    return res.data.chapter;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to link test" };
  }
};

export const unlinkTestFromChapter = async (chapterId, testId) => {
  try {
    const res = await api.delete(`/courses/chapters/${chapterId}/tests/${testId}`);
    return res.data.chapter;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to unlink test" };
  }
};

// ─── Student ─────────────────────────────────────────────────────────────────

export const getCourseFull = async (courseId) => {
  try {
    const res = await api.get(`/courses/${courseId}/tree`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch course" };
  }
};

// ─── Per-course one-time purchase (uses the course's own price + validity) ───
export const createCourseOrder = async (courseId) => {
  try {
    const res = await api.post(`/payment/course/${courseId}/order`);
    return res.data.order;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create course order" };
  }
};

export const verifyCoursePayment = async (courseId, payload) => {
  try {
    const res = await api.post(`/payment/course/${courseId}/verify`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Course payment verification failed" };
  }
};

export const checkCourseAccess = async (courseId) => {
  try {
    const res = await api.get(`/courses/${courseId}/access`);
    return res.data;
  } catch {
    return { hasAccess: false };
  }
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export const getCourseProgress = async (courseId) => {
  try {
    const res = await api.get(`/courses/${courseId}/progress`);
    return res.data;
  } catch {
    return { completedChapterIds: [], totalChapters: 0, completedCount: 0, percentage: 0 };
  }
};

export const markChapterComplete = async (chapterId) => {
  try {
    const res = await api.post(`/courses/chapters/${chapterId}/complete`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to mark complete" };
  }
};

export const unmarkChapterComplete = async (chapterId) => {
  try {
    const res = await api.delete(`/courses/chapters/${chapterId}/complete`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to unmark" };
  }
};

// Bulk: get progress for multiple courses (for course list page)
export const getMultipleCourseProgress = async (courseIds) => {
  try {
    const res = await api.post("/courses/progress/bulk", { courseIds });
    return res.data.progress || {};
  } catch {
    return {};
  }
};
