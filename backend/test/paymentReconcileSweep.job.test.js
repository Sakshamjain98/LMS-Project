import { beforeEach, describe, expect, it, vi } from "vitest";

const { find, reconcilePayment, ordersFetch } = vi.hoisted(() => ({
  find: vi.fn(),
  reconcilePayment: vi.fn(),
  ordersFetch: vi.fn(),
}));

vi.mock("../src/models/payment.model.js", () => ({
  default: { find },
}));

vi.mock("../src/config/razorpay.js", () => ({
  razorpay: { orders: { fetch: ordersFetch } },
}));

vi.mock("../src/modules/payment/payment.service.js", () => ({
  reconcilePayment,
}));

vi.mock("../src/infrastucture/logger/logger.js", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { runPaymentReconcileSweep } from "../src/infrastucture/jobs/paymentReconcileSweep.job.js";

describe("payment reconcile sweep", () => {
  beforeEach(() => {
    find.mockReset();
    reconcilePayment.mockReset();
    ordersFetch.mockReset();
  });

  it("fulfills orders Razorpay confirms as paid, leaves the rest pending, ignores dev orders", async () => {
    find.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve([
            { orderId: "order_paid" },
            { orderId: "order_unpaid" },
            { orderId: "order_broken" },
            { orderId: "dev_order_skip_me" },
          ]),
      }),
    });

    reconcilePayment.mockImplementation(async ({ orderId }) => {
      if (orderId === "order_paid") return { success: true };
      if (orderId === "order_unpaid") throw new Error(`Order ${orderId} is not paid yet (status: created)`);
      throw new Error("Razorpay API timeout");
    });

    const summary = await runPaymentReconcileSweep({ dryRun: false });

    expect(reconcilePayment).toHaveBeenCalledTimes(3); // dev_ order excluded
    expect(summary).toEqual({ checked: 3, fulfilled: 1, stillPending: 1, errors: 1 });
  });

  it("dry-run only reads from Razorpay, never calls reconcilePayment", async () => {
    find.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([{ orderId: "order_paid" }, { orderId: "order_unpaid" }]),
      }),
    });
    ordersFetch.mockImplementation(async (orderId) => ({
      status: orderId === "order_paid" ? "paid" : "created",
    }));

    const summary = await runPaymentReconcileSweep({ dryRun: true });

    expect(reconcilePayment).not.toHaveBeenCalled();
    expect(summary).toEqual({ checked: 2, fulfilled: 1, stillPending: 1, errors: 0 });
  });
});
