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

// ==================== USER SUBSCRIPTION / ACCESS ====================
export const getUserSubscription = async (userId) => {
  const res = await API.get(`/admin/users/${userId}/subscription`);
  return res.data;
};

// Disable premium access without deleting the account — user must repay.
export const disableUserAccess = async (userId, reason) => {
  const res = await API.post(`/admin/users/${userId}/subscription/disable`, { reason });
  return res.data;
};

export const enableUserAccess = async (userId, payload = {}) => {
  const res = await API.post(`/admin/users/${userId}/subscription/enable`, payload);
  return res.data;
};

// payload: { days } or { until }
export const extendUserAccess = async (userId, payload = {}) => {
  const res = await API.post(`/admin/users/${userId}/subscription/extend`, payload);
  return res.data;
};

// payload: { plan, durationDays }
export const grantUserPlan = async (userId, payload = {}) => {
  const res = await API.post(`/admin/users/${userId}/subscription/grant`, payload);
  return res.data;
};

// One-time content purchases (individual courses / test series)
export const getUserContentAccess = async (userId) => {
  const res = await API.get(`/admin/users/${userId}/content-access`);
  return res.data;
};

export const setCourseAccessDisabled = async (userId, courseId, disabled) => {
  const res = await API.post(`/admin/users/${userId}/content-access/course/${courseId}`, { disabled });
  return res.data;
};

export const setTopicAccessDisabled = async (userId, topicId, disabled) => {
  const res = await API.post(`/admin/users/${userId}/content-access/topic/${topicId}`, { disabled });
  return res.data;
};

// Extend / change expiry / reactivate a single course grant. Pass { days } or { until }.
export const extendCourseAccess = async (userId, courseId, payload = {}) => {
  const res = await API.post(`/admin/users/${userId}/content-access/course/${courseId}/extend`, payload);
  return res.data;
};

export const extendTopicAccess = async (userId, topicId, payload = {}) => {
  const res = await API.post(`/admin/users/${userId}/content-access/topic/${topicId}/extend`, payload);
  return res.data;
};

// ==================== PENDING CONTENT ====================
export const getPendingContent = async (params = {}) => {
  const res = await API.get("/admin/content/pending", { params });
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
export const getAllPayments = async (params = {}) => {
  const res = await API.get("/admin/payments", { params });
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

export const updateBlog = async (blogId, data) => {
  const res = await API.put(`/admin/cms/blog/${blogId}`, data);
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
export const getPendingTeachers = async (params = {}) => {
  const res = await API.get("/admin/teachers/pending", { params });
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

export const getAdmins = async (params = {}) => {
  const res = await API.get("/admin/admins", { params });
  return res.data;
};

export const updateAdmin = async (adminId, data) => {
  const res = await API.put(`/admin/admins/${adminId}`, data);
  return res.data;
};

export const deleteAdmin = async (adminId) => {
  const res = await API.delete(`/admin/admins/${adminId}`);
  return res.data;
};

// ==================== TEACHER FEATURE SETTINGS ====================
export const getTeacherFeatureSettings = async () => {
  const res = await API.get("/admin/settings/teacher");
  return res.data;
};

export const updateTeacherFeatureSettings = async (payload) => {
  const res = await API.put("/admin/settings/teacher", payload);
  return res.data;
};

// ==================== ADMIN PROFILE ====================
export const getAdminProfile = async () => {
  const res = await API.get("/admin/profile");
  return res.data;
};

export const updateAdminProfile = async (data) => {
  const res = await API.put("/admin/profile", data);
  return res.data;
};

export const changeAdminPassword = async (data) => {
  const res = await API.put("/admin/change-password", data);
  return res.data;
};
// -------------------- Site Content (Landing CMS) --------------------
export const getAdminSiteContent = async () => {
  const res = await API.get("/admin/site-content");
  return res.data;
};

export const updateAdminSiteContent = async (data) => {
  const res = await API.put("/admin/site-content", data);
  return res.data;
};

// Returns { url } — the secure Cloudinary URL of the uploaded image.
export const uploadSiteImage = async (file) => {
  const fd = new FormData();
  fd.append("image", file);
  const res = await API.post("/admin/site-content/upload-image", fd);
  return res.data;
};

export const getBlogById = async (blogId) => {
  const res = await API.get(`/admin/blogs/${blogId}`);
  return res.data;
};
