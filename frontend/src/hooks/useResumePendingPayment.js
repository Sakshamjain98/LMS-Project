import { useEffect } from "react";
import { getPendingOrder, clearPendingOrder } from "../utils/pendingPayment";
import { checkPendingOrder } from "../services/paymentService";

// Recovers a checkout whose Razorpay `handler` callback never fired — e.g. a
// UPI app-switch inside an in-app browser (Telegram, Instagram, ...) that
// suspended the page's JS context and never returned to it. The order id was
// stashed in localStorage before checkout opened; re-check it on mount and on
// every return-to-tab, and let the caller know if it turned out to be paid.
// `refId` may be omitted to match any pending order of this `kind` (list pages).
export const useResumePendingPayment = (kind, refId, onResumed) => {
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState === "hidden") return;
      const pending = getPendingOrder();
      if (!pending || pending.kind !== kind) return;
      if (refId != null && pending.refId !== String(refId)) return;
      try {
        const { fulfilled } = await checkPendingOrder(pending.orderId);
        if (fulfilled) {
          clearPendingOrder();
          onResumed();
        }
      } catch {
        // Not paid yet (or a transient error) — leave it for the next check.
      }
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [kind, refId, onResumed]);
};
