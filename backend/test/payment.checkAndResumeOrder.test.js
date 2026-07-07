import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, ordersFetch } = vi.hoisted(() => ({
  findOne: vi.fn(),
  ordersFetch: vi.fn(),
}));

vi.mock("../src/models/payment.model.js", () => ({
  default: { findOne },
}));

vi.mock("../src/config/razorpay.js", () => ({
  razorpay: { orders: { fetch: ordersFetch }, payments: { fetch: vi.fn() } },
}));

import { checkAndResumeOrder } from "../src/modules/payment/payment.service.js";

describe("checkAndResumeOrder (client resume path after a lost checkout callback)", () => {
  beforeEach(() => {
    findOne.mockReset();
    ordersFetch.mockReset();
  });

  it("rejects an order that doesn't belong to the requesting user", async () => {
    const owner = new mongoose.Types.ObjectId();
    const intruder = new mongoose.Types.ObjectId();
    findOne.mockResolvedValue({ userId: owner, status: "PENDING", orderId: "order_1" });

    await expect(checkAndResumeOrder(intruder, "order_1")).rejects.toMatchObject({ statusCode: 404 });
    expect(ordersFetch).not.toHaveBeenCalled();
  });

  it("short-circuits as fulfilled when already SUCCESS, without calling Razorpay", async () => {
    const userId = new mongoose.Types.ObjectId();
    findOne.mockResolvedValue({ userId, status: "SUCCESS", orderId: "order_1" });

    const result = await checkAndResumeOrder(userId, "order_1");

    expect(result).toEqual({ fulfilled: true });
    expect(ordersFetch).not.toHaveBeenCalled();
  });

  it("returns fulfilled:false (not an error) when Razorpay says the order isn't paid yet", async () => {
    const userId = new mongoose.Types.ObjectId();
    findOne.mockResolvedValue({ userId, status: "PENDING", orderId: "order_1" });
    ordersFetch.mockResolvedValue({ status: "created", notes: {} });

    const result = await checkAndResumeOrder(userId, "order_1");

    expect(result).toEqual({ fulfilled: false });
  });
});
