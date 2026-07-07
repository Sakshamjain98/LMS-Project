import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findById, findByIdAndDelete, exists, userFindByIdAndDelete } = vi.hoisted(() => ({
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
  exists: vi.fn(),
  userFindByIdAndDelete: vi.fn(),
}));

vi.mock("../src/models/payment.model.js", () => ({
  default: { findById, findByIdAndDelete, exists },
}));

vi.mock("../src/models/user.model.js", () => ({
  default: { findByIdAndDelete: userFindByIdAndDelete },
}));

// admin.service.js imports payment.service.js at module scope (for the
// force-grant feature), which in turn boots the Razorpay SDK from env vars —
// irrelevant here, so stub it out to keep this test isolated.
vi.mock("../src/modules/payment/payment.service.js", () => ({
  fulfillTopicAccess: vi.fn(),
  fulfillCourseAccess: vi.fn(),
  fulfillSubscriptionByOrderId: vi.fn(),
}));

import { deletePendingPaymentAndUser } from "../src/modules/admin/admin.service.js";

describe("deletePendingPaymentAndUser (cleanup for a stuck/abandoned checkout)", () => {
  beforeEach(() => {
    findById.mockReset();
    findByIdAndDelete.mockReset();
    exists.mockReset();
    userFindByIdAndDelete.mockReset();
  });

  it("throws when the payment doesn't exist", async () => {
    findById.mockResolvedValue(null);
    await expect(deletePendingPaymentAndUser("missing-id")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("refuses to delete a payment that isn't PENDING", async () => {
    findById.mockResolvedValue({ status: "SUCCESS", userId: "u1", _id: "p1" });
    await expect(deletePendingPaymentAndUser("p1")).rejects.toMatchObject({ statusCode: 400 });
    expect(findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("deletes both the payment and the user when there's no other completed payment", async () => {
    const userId = new mongoose.Types.ObjectId();
    const paymentId = new mongoose.Types.ObjectId();
    findById.mockResolvedValue({ status: "PENDING", userId, _id: paymentId });
    exists.mockResolvedValue(false);

    const result = await deletePendingPaymentAndUser(paymentId);

    expect(findByIdAndDelete).toHaveBeenCalledWith(paymentId);
    expect(userFindByIdAndDelete).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ paymentDeleted: true, userDeleted: true });
  });

  it("deletes only the payment, keeps the user, when they have another completed payment", async () => {
    const userId = new mongoose.Types.ObjectId();
    const paymentId = new mongoose.Types.ObjectId();
    findById.mockResolvedValue({ status: "PENDING", userId, _id: paymentId });
    exists.mockResolvedValue(true);

    const result = await deletePendingPaymentAndUser(paymentId);

    expect(findByIdAndDelete).toHaveBeenCalledWith(paymentId);
    expect(userFindByIdAndDelete).not.toHaveBeenCalled();
    expect(result).toEqual({ paymentDeleted: true, userDeleted: false });
  });
});
