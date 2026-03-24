import api from "./api";

export const getPlans = async () => {
  try {
    const res = await api.get("/payment/plans");
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to fetch plans" };
  }
};

export const createOrder = async (planId) => {
  try {
    const res = await api.post("/payment/create-order", { planId });
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to create order" };
  }
};

export const verifyPayment = async (payload) => {
  try {
    const res = await api.post("/payment/verify", payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Failed to verify payment" };
  }
};
