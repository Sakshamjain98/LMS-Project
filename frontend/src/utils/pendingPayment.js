const KEY = "pendingPaymentOrder";

// Stashed right before opening Razorpay checkout so a lost `handler` callback
// (closed tab, UPI app-switch inside an in-app browser losing its JS context)
// can still be resumed on the next visit — see useResumePendingPayment.
export const savePendingOrder = ({ orderId, kind, refId }) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ orderId, kind, refId: String(refId) }));
  } catch {
    // localStorage unavailable — resume just won't be possible, checkout still works.
  }
};

export const getPendingOrder = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

export const clearPendingOrder = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};
