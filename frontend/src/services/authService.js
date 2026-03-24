import API from "./api";

export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const googleAuth = async (data) => {
  const res = await API.post("/auth/google", data);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};

export const sendOTP = async (data) => {
  const res = await API.post("/auth/otp/send", data);
  return res.data;
};

export const verifyOTP = async (data) => {
  const res = await API.post("/auth/otp/verify", data);
  return res.data;
};