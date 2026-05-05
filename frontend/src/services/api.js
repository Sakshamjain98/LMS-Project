const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const normalizedApiBaseUrl = rawApiBaseUrl?.trim().replace(/\/+$/, "");
const apiBaseUrl = normalizedApiBaseUrl
  ? (normalizedApiBaseUrl.endsWith("/api") ? normalizedApiBaseUrl : `${normalizedApiBaseUrl}/api`)
  : "/api";

const TIMEOUT_MS = 15000;

const buildUrl = (url, params) => {
  const path = `${apiBaseUrl}${url}`;
  if (!params || typeof params !== "object" || Object.keys(params).length === 0) {
    return path;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });
  return `${path}?${searchParams.toString()}`;
};

const request = async (method, url, data, config = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...(config.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  if (!isFormData && data !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(url, config.params), {
      method,
      headers,
      body: data === undefined ? undefined : isFormData ? data : JSON.stringify(data),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(payload?.message || `Request failed with status ${response.status}`);
      error.response = { status: response.status, data: payload };
      throw error;
    }

    return {
      data: payload,
      status: response.status,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Request timed out");
      timeoutError.response = { status: 408, data: { message: "Request timed out" } };
      throw timeoutError;
    }
    if (error.response) throw error;
    throw new Error(error.message || "Network error");
  } finally {
    clearTimeout(timeoutId);
  }
};

const api = {
  get: (url, config) => request("GET", url, undefined, config),
  post: (url, data, config) => request("POST", url, data, config),
  put: (url, data, config) => request("PUT", url, data, config),
  delete: (url, config) => request("DELETE", url, undefined, config),
};

export default api;