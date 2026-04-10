import API from "./api";

// ==================== DASHBOARD ====================
export const getAdminDashboard = async () => {
  const res = await API.get("/admin/dashboard");
  return res.data;
};

// ==================== USER MANAGEMENT ====================
export const getAllUsers = async (params = {}) => {
  const res = await API.get("/admin/users", { params });
  return res.data;
};

export const updateUserRole = async (userId, role) => {
  const res = await API.put(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await API.delete(`/admin/users/${userId}`);
  return res.data;
};

// ==================== PENDING CONTENT ====================
export const getPendingContent = async () => {
  const res = await API.get("/admin/content/pending");
  return res.data;
};

export const approveCourse = async (courseId) => {
  const res = await API.put(`/admin/content/course/${courseId}/approve`);
  return res.data;
};

export const rejectCourse = async (courseId) => {
  const res = await API.delete(`/admin/content/course/${courseId}/reject`);
  return res.data;
};

// ==================== PAYMENT MANAGEMENT ====================
export const getAllPayments = async () => {
  const res = await API.get("/admin/payments");
  return res.data;
};

export const refundPayment = async (paymentId) => {
  const res = await API.put(`/admin/payments/${paymentId}/refund`);
  return res.data;
};

// ==================== BLOG MANAGEMENT ====================
export const createBlog = async (data) => {
  const res = await API.post("/admin/cms/blog", data);
  return res.data;
};
export const getBlogs = async (params = {}) => {
  const res = await API.get("/admin/blogs", { params });
  return res.data;
};

export const deleteBlog = async (blogId) => {
  const res = await API.delete(`/admin/cms/blog/${blogId}`);
  return res.data;
};

// ==================== TEACHER APPROVAL ====================
export const getPendingTeachers = async () => {
  const res = await API.get("/admin/teachers/pending");
  return res.data;
};

export const approveTeacher = async (teacherId) => {
  const res = await API.put(`/admin/teachers/${teacherId}/approve`);
  return res.data;
};

// ==================== NEWS MANAGEMENT ====================
export const getAllNews = async (params = {}) => {
  const res = await API.get("/admin/news", { params });
  return res.data;
};

export const getNewsById = async (newsId) => {
  const res = await API.get(`/admin/news/${newsId}`);
  return res.data;
};

export const createNews = async (data) => {
  const res = await API.post("/admin/news", data);
  return res.data;
};

export const updateNews = async (newsId, data) => {
  const res = await API.put(`/admin/news/${newsId}`, data);
  return res.data;
};

export const deleteNews = async (newsId) => {
  const res = await API.delete(`/admin/news/${newsId}`);
  return res.data;
};

// ==================== COMMENT MODERATION ====================
export const getPendingComments = async () => {
  const res = await API.get("/admin/comments/pending");
  return res.data;
};

export const approveComment = async (commentId) => {
  const res = await API.put(`/admin/comments/${commentId}/approve`);
  return res.data;
};

export const deleteComment = async (commentId) => {
  const res = await API.delete(`/admin/comments/${commentId}`);
  return res.data;
};

export const getAllComments = async (params = {}) => {
  const res = await API.get("/admin/comments", { params });
  return res.data;
};

// ==================== SUBSCRIPTION PLANS ====================
export const getAllPlans = async () => {
  const res = await API.get("/admin/plans");
  return res.data;
};

export const createPlan = async (data) => {
  const res = await API.post("/admin/plans", data);
  return res.data;
};

export const updatePlan = async (planId, data) => {
  const res = await API.put(`/admin/plans/${planId}`, data);
  return res.data;
};

export const deletePlan = async (planId) => {
  const res = await API.delete(`/admin/plans/${planId}`);
  return res.data;
};

// ==================== ANALYTICS ====================
export const getRevenueAnalytics = async (period = "monthly") => {
  const res = await API.get("/admin/analytics/revenue", { params: { period } });
  return res.data;
};

export const getUserAnalytics = async () => {
  const res = await API.get("/admin/analytics/users");
  return res.data;
};

export const getTestAnalytics = async () => {
  const res = await API.get("/admin/analytics/tests");
  return res.data;
};

export const getCourseAnalytics = async () => {
  const res = await API.get("/admin/analytics/courses");
  return res.data;
};

// ==================== CREATE ADMIN (Super Admin) ====================
export const createAdmin = async (data) => {
  const res = await API.post("/admin/create", data);
  return res.data;
};