import api from "./api";

export const getTeacherDashboard = async () => {
  try {
    const response = await api.get("/teacher/dashboard");
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Something went wrong" };
  }
};

export const getTeacherUiSettings = async () => {
  try {
    const response = await api.get("/teacher/ui-settings");
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Unable to load UI settings" };
  }
};

export const createCourse = async (formData) => {
  try {
    const res = await api.post("/teacher/courses", formData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Course creation failed" };
  }
};

export const getMyCourses = async () => {
  try {
    const res = await api.get("/teacher/courses");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch courses" };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const res = await api.get(`/teacher/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Course not found" };
  }
};

export const updateCourse = async (courseId, formData) => {
  try {
    const res = await api.put(`/teacher/courses/${courseId}`, formData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update failed" };
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const res = await api.delete(`/teacher/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete failed" };
  }
};

export const addSection = async (courseId, sectionData) => {
  try {
    const response = await api.post(
      `/teacher/courses/${courseId}/sections`,
      sectionData
    );
    
    if (!response.data.section) {
      throw new Error("Section creation failed - no section returned");
    }
    
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Failed to add section" };
  }
};

export const updateSection = async (courseId, sectionId, data) => {
  try {
    const res = await api.put(`/teacher/courses/${courseId}/sections/${sectionId}`, data);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Section update failed" };
  }
};

export const deleteSection = async (courseId, sectionId) => {
  try {
    const res = await api.delete(`/teacher/courses/${courseId}/sections/${sectionId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Section delete failed" };
  }
};

export const uploadSectionNotes = async (courseId, sectionId, files) => {
  try {
    const fd = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach((file) => {
        if (file instanceof File) {
          fd.append("notes", file);
        }
      });
    } else if (files instanceof File) {
      fd.append("notes", files);
    }

    const response = await api.post(
      `/teacher/courses/${courseId}/sections/${sectionId}/notes`,
      fd
    );
    
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Failed to upload notes" };
  }
};

export const addVideoToSection = async (courseId, sectionId, videoData) => {
  try {
    const response = await api.post(
      `/teacher/courses/${courseId}/sections/${sectionId}/videos`,
      videoData
    );
    
    if (!response.data.videos) {
      throw new Error("Video addition failed");
    }
    
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Failed to add video" };
  }
};

export const updateVideoToSection = async (courseId, sectionId, videoIndex, videoData) => {
  try {
    const response = await api.put(
      `/teacher/courses/${courseId}/sections/${sectionId}/videos/${videoIndex}`,
      videoData
    );
    
    if (!response.data.videos) {
      throw new Error("Video update failed");
    }
    
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Failed to update video" };
  }
};

export const deleteVideoFromSection = async (courseId, sectionId, videoIndex) => {
  try {
    const res = await api.delete(
      `/teacher/courses/${courseId}/sections/${sectionId}/videos/${videoIndex}`
    );
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Video delete failed" };
  }
};

// ================= NOTES =================
export const createNote = async (formData) => {
  try {
    const res = await api.post("/teacher/notes", formData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create failed" };
  }
};

export const getTeacherNotes = async () => {
  try {
    const res = await api.get("/teacher/notes");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch failed" };
  }
};

export const getNoteById = async (id) => {
  try {
    const res = await api.get(`/teacher/notes/${id}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch failed" };
  }
};

export const updateNote = async (id, formData) => {
  try {
    const res = await api.put(`/teacher/notes/${id}`, formData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update failed" };
  }
};

export const deleteNote = async (id) => {
  try {
    const res = await api.delete(`/teacher/notes/${id}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete failed" };
  }
};

// ================= TESTS =================
export const getTeacherTests = async (params = {}) => {
  try {
    const res = await api.get("/teacher/tests", { params });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch tests failed" };
  }
};

export const getTeacherTestSeries = async () => {
  try {
    const res = await api.get("/teacher/test-series");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch test series failed" };
  }
};

export const getTeacherFullHierarchy = async () => {
  try {
    const res = await api.get("/teacher/test-series/hierarchy");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch hierarchy failed" };
  }
};

// ================= EXAM CATEGORIES =================
export const getExamCategories = async () => {
  try {
    const res = await api.get("/teacher/exam-categories");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch exam categories failed" };
  }
};

export const createExamCategory = async (payload) => {
  try {
    const res = await api.post("/teacher/exam-categories", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create exam category failed" };
  }
};

export const updateExamCategory = async (categoryId, payload) => {
  try {
    const res = await api.put(`/teacher/exam-categories/${categoryId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update exam category failed" };
  }
};

export const deleteExamCategory = async (categoryId) => {
  try {
    const res = await api.delete(`/teacher/exam-categories/${categoryId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete exam category failed" };
  }
};

export const reorderExamCategories = async (categoryIds) => {
  try {
    const res = await api.patch("/teacher/exam-categories/reorder", { categoryIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder exam categories failed" };
  }
};

// ================= EXAMS =================
export const getExams = async (categoryId = null) => {
  try {
    const params = categoryId ? { categoryId } : {};
    const res = await api.get("/teacher/exams", { params });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch exams failed" };
  }
};

export const createExam = async (payload) => {
  try {
    const res = await api.post("/teacher/exams", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create exam failed" };
  }
};

export const updateExam = async (examId, payload) => {
  try {
    const res = await api.put(`/teacher/exams/${examId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update exam failed" };
  }
};

export const deleteExam = async (examId) => {
  try {
    const res = await api.delete(`/teacher/exams/${examId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete exam failed" };
  }
};

export const reorderExams = async (examCategoryId, examIds) => {
  try {
    const res = await api.patch("/teacher/exams/reorder", { examCategoryId, examIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder exams failed" };
  }
};

export const assignTestSeriesToExam = async (topicId, examId) => {
  try {
    const res = await api.patch(`/teacher/test-series/topics/${topicId}/assign-exam`, { examId });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Assign test series failed" };
  }
};

// ================= AITS =================
export const getAITSByExam = async (examId) => {
  try {
    const res = await api.get(`/teacher/aits/exam/${examId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Fetch AITS failed" };
  }
};

export const createAITS = async (payload) => {
  try {
    const res = await api.post("/teacher/aits", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create AITS failed" };
  }
};

export const updateAITS = async (aitsId, payload) => {
  try {
    const res = await api.put(`/teacher/aits/${aitsId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update AITS failed" };
  }
};

export const deleteAITS = async (aitsId) => {
  try {
    const res = await api.delete(`/teacher/aits/${aitsId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete AITS failed" };
  }
};

export const createAITSTest = async (aitsId, payload) => {
  try {
    const res = await api.post(`/teacher/aits/${aitsId}/tests`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create AITS test failed" };
  }
};

export const reorderAITS = async (examId, aitsIds) => {
  try {
    const res = await api.patch("/teacher/aits/reorder", { examId, aitsIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder AITS failed" };
  }
};

export const reorderAITSTests = async (aitsId, testIds) => {
  try {
    const res = await api.patch(`/teacher/aits/${aitsId}/tests/reorder`, { testIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder AITS tests failed" };
  }
};

export const getTopicAnalytics = async (topicId) => {
  try {
    const res = await api.get(`/teacher/test-series/topics/${topicId}/analytics`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to load analytics" };
  }
};

export const createTestSeriesTopic = async (payload) => {
  try {
    const res = await api.post("/teacher/test-series/topics", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create topic failed" };
  }
};

export const updateTestSeriesTopic = async (topicId, payload) => {
  try {
    const res = await api.put(`/teacher/test-series/topics/${topicId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update topic failed" };
  }
};

export const deleteTestSeriesTopic = async (topicId) => {
  try {
    const res = await api.delete(`/teacher/test-series/topics/${topicId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete topic failed" };
  }
};

export const reorderTestSeriesTopics = async (examId, topicIds) => {
  try {
    const res = await api.patch("/teacher/test-series/topics/reorder", { examId, topicIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder test series failed" };
  }
};

export const createTestSeriesSubject = async (topicId, payload) => {
  try {
    const res = await api.post(`/teacher/test-series/topics/${topicId}/subjects`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create subject failed" };
  }
};

export const updateTestSeriesSubject = async (subjectId, payload) => {
  try {
    const res = await api.put(`/teacher/test-series/subjects/${subjectId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update subject failed" };
  }
};

export const deleteTestSeriesSubject = async (subjectId) => {
  try {
    const res = await api.delete(`/teacher/test-series/subjects/${subjectId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete subject failed" };
  }
};

export const reorderTestSeriesSubjects = async (topicId, subjectIds) => {
  try {
    const res = await api.patch(`/teacher/test-series/topics/${topicId}/subjects/reorder`, { subjectIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder subjects failed" };
  }
};

export const createTestSeriesChapter = async (subjectId, payload) => {
  try {
    const res = await api.post(`/teacher/test-series/subjects/${subjectId}/chapters`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create chapter failed" };
  }
};

export const updateTestSeriesChapter = async (chapterId, payload) => {
  try {
    const res = await api.put(`/teacher/test-series/chapters/${chapterId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update chapter failed" };
  }
};

export const deleteTestSeriesChapter = async (chapterId) => {
  try {
    const res = await api.delete(`/teacher/test-series/chapters/${chapterId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete chapter failed" };
  }
};

export const reorderTestSeriesChapters = async (subjectId, chapterIds) => {
  try {
    const res = await api.patch(`/teacher/test-series/subjects/${subjectId}/chapters/reorder`, { chapterIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder chapters failed" };
  }
};

export const createTestSeriesTest = async (chapterId, payload) => {
  try {
    const res = await api.post(`/teacher/test-series/chapters/${chapterId}/tests`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Create test failed" };
  }
};

export const reorderTestSeriesTests = async (chapterId, testIds) => {
  try {
    const res = await api.patch(`/teacher/test-series/chapters/${chapterId}/tests/reorder`, { testIds });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Reorder tests failed" };
  }
};

export const createTeacherTest = async (payload) => {
  try {
    const res = await api.post("/teacher/tests", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Test creation failed" };
  }
};

export const getTeacherTestById = async (testId) => {
  try {
    const res = await api.get(`/teacher/tests/${testId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Test not found" };
  }
};

export const updateTeacherTest = async (testId, payload) => {
  try {
    const res = await api.put(`/teacher/tests/${testId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update failed" };
  }
};

export const deleteTeacherTest = async (testId) => {
  try {
    const res = await api.delete(`/teacher/tests/${testId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete failed" };
  }
};

export const saveTestConfig = async (testId, payload) => {
  try {
    const res = await api.post(`/teacher/tests/${testId}/config`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Config save failed" };
  }
};

export const publishTeacherTest = async (testId, payload) => {
  try {
    const res = await api.post(`/teacher/tests/${testId}/publish`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Publish failed" };
  }
};

export const previewTeacherTest = async (testId) => {
  try {
    const res = await api.get(`/teacher/tests/${testId}/preview`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Preview failed" };
  }
};

export const getTeacherTestAnalytics = async (testId) => {
  try {
    const res = await api.get(`/teacher/tests/${testId}/analytics`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Analytics fetch failed" };
  }
};

export const getTeacherQuestionAnalytics = async (testId, questionId) => {
  try {
    const res = await api.get(`/teacher/tests/${testId}/questions/${questionId}/analytics`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Question analytics fetch failed" };
  }
};

// ================= QUESTIONS =================
export const getTestQuestions = async (testId) => {
  try {
    const res = await api.get(`/questions/test/${testId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Questions fetch failed" };
  }
};

export const bulkAddQuestionsToTest = async (testId, payload) => {
  try {
    const res = await api.post(`/questions/test/${testId}/bulk`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Bulk add questions failed" };
  }
};

export const addQuestionToTest = async (testId, payload) => {
  try {
    const res = await api.post(`/questions/test/${testId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Add question failed" };
  }
};

export const updateQuestion = async (questionId, payload) => {
  try {
    const res = await api.put(`/questions/${questionId}`, payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Update question failed" };
  }
};

export const deleteQuestion = async (questionId) => {
  try {
    const res = await api.delete(`/questions/${questionId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Delete question failed" };
  }
};

export const getQuestionAnalytics = async (questionId) => {
  try {
    const res = await api.get(`/questions/${questionId}/analytics`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Question analytics fetch failed" };
  }
};

// ================= TEACHER PROFILE =================
export const getTeacherProfile = async () => {
  try {
    const res = await api.get("/teacher/profile");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Profile fetch failed" };
  }
};

export const updateTeacherProfile = async (data) => {
  try {
    const res = await api.put("/teacher/profile", data);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Profile update failed" };
  }
};


export const uploadTestCSV = async (formData) => {
  try {
    // Do NOT set Content-Type manually — the browser auto-sets it with the
    // multipart boundary. Setting it strips the boundary and the server fails
    // with "multi part boundary not found".
    const res = await api.post("/teacher/tests/upload-csv", formData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to upload CSV" };
  }
};

export const uploadQuestionImage = async (file) => {
  try {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.post("/teacher/tests/upload-question-image", fd);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to upload image" };
  }
};