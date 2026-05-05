import api from "./api";

// ─── Profile ────────────────────────────────────────────────────────────────
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

// ─── Tests ──────────────────────────────────────────────────────────────────
export const getAvailableTests = async () => {
  try {
    const res = await api.get("/student/tests");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch available tests" };
  }
};

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

// ─── Payments / Subscription ────────────────────────────────────────────────
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

export const getStudentSubscription = async () => {
  try {
    const res = await api.get("/payment/subscription");
    return res.data.subscription;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch subscription" };
  }
};

export const activateFreeSubscription = async () => {
  try {
    const res = await api.post("/payment/activate-free");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to activate free plan" };
  }
};

// ─── Public (no auth) ───────────────────────────────────────────────────────
export const getPublicArticles = async (limit = 6) => {
  try {
    const res = await api.get("/public/blogs", { params: { limit } });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch articles" };
  }
};

export const getPublicNews = async (limit = 5) => {
  try {
    const res = await api.get("/public/news", { params: { limit } });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch news" };
  }
};

export const getPublicSiteContent = async () => {
  try {
    const res = await api.get("/public/site-content");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch site content" };
  }
};
