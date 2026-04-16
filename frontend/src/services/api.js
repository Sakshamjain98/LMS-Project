import axios from "axios";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const normalizedApiBaseUrl = rawApiBaseUrl?.trim().replace(/\/+$/, "");
const apiBaseUrl = normalizedApiBaseUrl
  ? (normalizedApiBaseUrl.endsWith("/api") ? normalizedApiBaseUrl : `${normalizedApiBaseUrl}/api`)
  : "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;