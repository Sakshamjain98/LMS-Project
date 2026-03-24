import api from "./api";

// Dashboard
export const getStudentDashboard = async () => {
  try {
    const res = await api.get("/student/dashboard");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch dashboard" };
  }
};

// Profile
export const getStudentProfile = async () => {
  try {
    const res = await api.get("/student/profile");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Profile fetch failed" };
  }
};

export const updateStudentProfile = async (data) => {
  try {
    const res = await api.put("/student/profile", data);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Profile update failed" };
  }
};

// Courses
export const getAllCourses = async () => {
  try {
    const res = await api.get("/student/courses");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch courses" };
  }
};

export const getFreeCourses = async () => {
  try {
    const res = await api.get("/student/free/courses");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch free courses" };
  }
};

export const getPaidCourses = async () => {
  try {
    const res = await api.get("/student/paid/courses");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch paid courses" };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const res = await api.get(`/student/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch course" };
  }
};

// Notes
export const getAllNotes = async () => {
  try {
    const res = await api.get("/student/notes");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch notes" };
  }
};

export const getFreeNotes = async () => {
  try {
    const res = await api.get("/student/free/notes");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch free notes" };
  }
};

export const getPaidNotes = async () => {
  try {
    const res = await api.get("/student/paid/notes");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch paid notes" };
  }
};

export const getNoteById = async (noteId) => {
  try {
    const res = await api.get(`/student/notes/${noteId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch note" };
  }
};

// Blogs
export const getAllBlogs = async () => {
  try {
    const res = await api.get("/student/blogs");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch blogs" };
  }
};

// Schedule
export const getStudentSchedule = async () => {
  try {
    const res = await api.get("/student/schedule");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch schedule" };
  }
};

// Payment History
export const getPaymentHistory = async () => {
  try {
    const res = await api.get("/student/payment-history");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch payment history" };
  }
};

// Performance
export const getPerformance = async () => {
  try {
    const res = await api.get("/student/performance");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch performance data" };
  }
};

// Tests
export const startTest = async (testId) => {
  try {
    const res = await api.post(`/test/start/${testId}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to start test" };
  }
};

export const submitAnswer = async (attemptId, answerData) => {
  try {
    const res = await api.post(`/test/${attemptId}/answer`, answerData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to submit answer" };
  }
};

export const submitTest = async (attemptId, testData) => {
  try {
    const res = await api.post(`/test/${attemptId}/submit`, testData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to submit test" };
  }
};

export const getTestResult = async (attemptId) => {
  try {
    const res = await api.get(`/test/${attemptId}/result`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch result" };
  }
};

export const getMyAttempts = async () => {
  try {
    const res = await api.get("/test/my-attempts");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch attempts" };
  }
};

export const getTestLeaderboard = async (testId, limit = 10) => {
  try {
    const res = await api.get(`/test/leaderboard/${testId}?limit=${limit}`);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch leaderboard" };
  }
};

// ================= PAYMENT =================
export const createPaymentOrder = async (planId) => {
  try {
    const res = await api.post("/payment/create-order", { planId });
    return res.data.order;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create order" };
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const res = await api.post("/payment/verify", paymentData);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Payment verification failed" };
  }
};

export const getPaymentPlans = async () => {
  try {
    const res = await api.get("/payment/plans");
    return res.data.plans;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch plans" };
  }
};
