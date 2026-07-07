import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findById, fulfillTopicAccess, fulfillCourseAccess, fulfillSubscriptionByOrderId } = vi.hoisted(() => ({
  findById: vi.fn(),
  fulfillTopicAccess: vi.fn(),
  fulfillCourseAccess: vi.fn(),
  fulfillSubscriptionByOrderId: vi.fn(),
}));

vi.mock("../src/models/payment.model.js", () => ({
  default: { findById },
}));

vi.mock("../src/modules/payment/payment.service.js", () => ({
  fulfillTopicAccess,
  fulfillCourseAccess,
  fulfillSubscriptionByOrderId,
}));

import { forceGrantPayment } from "../src/modules/admin/admin.service.js";

const makePayment = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  refId: new mongoose.Types.ObjectId(),
  orderId: "order_1",
  paymentId: null,
  status: "PENDING",
  kind: "COURSE",
  save: vi.fn(),
  ...overrides,
});

describe("forceGrantPayment (admin bypass for a stuck payment)", () => {
  beforeEach(() => {
    findById.mockReset();
    fulfillTopicAccess.mockReset();
    fulfillCourseAccess.mockReset();
    fulfillSubscriptionByOrderId.mockReset();
  });

  it("throws when the payment doesn't exist", async () => {
    findById.mockResolvedValue(null);
    await expect(forceGrantPayment("missing-id", "admin-1")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("short-circuits without re-granting when already SUCCESS", async () => {
    const payment = makePayment({ status: "SUCCESS" });
    findById.mockResolvedValue(payment);

    const result = await forceGrantPayment(payment._id, "admin-1");

    expect(result).toEqual({ alreadyProcessed: true, payment });
    expect(fulfillCourseAccess).not.toHaveBeenCalled();
  });

  it("routes a COURSE payment to fulfillCourseAccess and stamps the forcing admin", async () => {
    const payment = makePayment({ kind: "COURSE" });
    findById.mockResolvedValue(payment);

    await forceGrantPayment(payment._id, "admin-1", "confirmed via bank statement");

    expect(fulfillCourseAccess).toHaveBeenCalledWith(payment.userId, payment.refId, expect.objectContaining({ orderId: "order_1" }));
    expect(payment.status).toBe("SUCCESS");
    expect(payment.forcedBy).toBe("admin-1");
    expect(payment.forceGrantReason).toBe("confirmed via bank statement");
    expect(payment.save).toHaveBeenCalled();
  });

  it("routes a TOPIC payment to fulfillTopicAccess", async () => {
    const payment = makePayment({ kind: "TOPIC" });
    findById.mockResolvedValue(payment);

    await forceGrantPayment(payment._id, "admin-1");

    expect(fulfillTopicAccess).toHaveBeenCalledWith(payment.userId, payment.refId, expect.objectContaining({ orderId: "order_1" }));
    expect(fulfillCourseAccess).not.toHaveBeenCalled();
  });

  it("routes a SUBSCRIPTION payment (default kind) to fulfillSubscriptionByOrderId", async () => {
    const payment = makePayment({ kind: "SUBSCRIPTION" });
    findById.mockResolvedValue(payment);

    await forceGrantPayment(payment._id, "admin-1");

    expect(fulfillSubscriptionByOrderId).toHaveBeenCalledWith("order_1", expect.any(String));
  });
});
