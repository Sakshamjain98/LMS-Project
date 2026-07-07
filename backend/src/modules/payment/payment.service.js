import Payment from "../../models/payment.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { paymentQueue } from "../../infrastucture/queues/payment.queue.js";
import { SUBSCRIPTION_PLANS } from "../../constants/subscription.js";
import { razorpay } from "../../config/razorpay.js";
import crypto from "crypto";
import mongoose from "mongoose";
import Subscription from "../../models/subscription.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import TopicAccess from "../../models/topicAccess.model.js";
import Course from "../../models/course.model.js";
import { grantCourseAccess } from "../courses/courses.service.js";

const getPlanDurationInDays = (plan) => {
  if (plan === "YEARLY") return 365;
  if (plan === "QUARTERLY") return 90;
  return 30;
};

// Returns a Date `months` from now, or null for 0/no-expiry (lifetime).
const expiryFromMonths = (months) => {
  const m = Number(months) || 0;
  if (m <= 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
};

// The amount actually charged for a paid item (course / test-series topic):
// the discounted/selling price when it's a genuine discount below the original
// price, otherwise the original price. Mirrors the frontend display rule.
const sellingPrice = (item) =>
  item.discountedPrice > 0 && item.discountedPrice < item.price
    ? item.discountedPrice
    : item.price;

const activatePaidSubscription = async (payment) => {
  const durationInDays = getPlanDurationInDays(payment.plan);
  const now = new Date();
  const currentSubscription = await Subscription.findOne({ userId: payment.userId });

  let startDate = now;
  if (
    currentSubscription?.status === "ACTIVE" &&
    currentSubscription?.endDate &&
    currentSubscription.endDate > now &&
    currentSubscription.plan !== "FREE"
  ) {
    startDate = currentSubscription.endDate;
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationInDays);

  await Subscription.findOneAndUpdate(
    { userId: payment.userId },
    {
      $set: {
        plan: payment.plan,
        status: "ACTIVE",
        price: payment.amount,
        currency: payment.currency || "INR",
        startDate: currentSubscription?.plan === payment.plan ? currentSubscription.startDate || now : now,
        endDate,
        billingCycle: payment.plan,
        source: "PAYMENT",
        // Repaying clears any admin-disabled state so access is fully restored.
        disabledAt: null,
        disabledBy: null,
        disabledReason: null,
      },
      $push: {
        paymentHistory: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          paidAt: payment.approvedAt || payment.verifiedAt || now,
          plan: payment.plan,
        },
      },
    },
    { upsert: true, new: true }
  );
};

export const userHasPaidSubscription = async (userId) => {
  const sub = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    plan: { $ne: "FREE" },
    endDate: { $gt: new Date() },
  }).lean();

  if (!sub) return false;

  const approvedPayment = await Payment.findOne({
    userId,
    plan: sub.plan,
    status: "SUCCESS",
    adminApproved: true,
  }).lean();

  return !!approvedPayment;
};

export const getPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS).filter((p) => p.id !== "FREE");
};

export const createOrder = async (userId, planId) => {
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan || plan.id === "FREE") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid plan selected");
  }

  let orderId;
  let razorpayOrderData = null;

  if (process.env.PAYMENT_MODE === "DEV") {
    // Dev mode: skip real Razorpay order creation
    orderId = `dev_order_${Date.now()}_${userId}`;
  } else {
    // Production: create real Razorpay order
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(STATUS_CODES.SERVER_ERROR, "Razorpay configuration missing");
    }

    try {
      razorpayOrderData = await razorpay.orders.create({
        amount: Math.round(plan.price * 100), // Ensure it's a strict integer
        currency: "INR",
        receipt: `rcpt_${Date.now().toString().slice(-8)}_${userId.toString().slice(-4)}`, // Keep under 40 chars
        notes: {
          userId: userId.toString(),
          planId: plan.id,
        },
      });
      orderId = razorpayOrderData.id;
    } catch (razorpayError) {
      console.error("Razorpay SDK Error:", razorpayError);
      throw new ApiError(
        STATUS_CODES.SERVER_ERROR,
        razorpayError.error?.description || "Failed to create order with payment gateway"
      );
    }
  }

  await Payment.create({
    userId,
    orderId,
    amount: plan.price,
    plan: plan.id,
    kind: "SUBSCRIPTION",
    description: `${plan.name} subscription`,
    status: "PENDING",
    adminApproved: false,
  });

  return {
    orderId,
    amount: plan.price,
    amountInPaise: plan.price * 100,
    currency: "INR",
    plan: plan.id,
    planName: plan.name,
    duration: plan.duration,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "DEV_KEY",
    ...(razorpayOrderData && { razorpayOrder: razorpayOrderData }),
  };
};

export const verifyPayment = async ({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const payment = await Payment.findOne({ orderId: razorpay_order_id });

  if (!payment) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Payment order not found in database.");
  }

  // Prevent duplicate processing
  if (payment.status === "SUCCESS" || payment.status === "PENDING_APPROVAL" || payment.status === "APPROVED") {
    return { alreadyProcessed: true };
  }

  // Security
  if (payment.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized payment verification attempt.");
  }

  if (process.env.PAYMENT_MODE === "DEV") {
    payment.paymentId = razorpay_payment_id || `DEV_PAY_${Date.now()}`;
    payment.status = "SUCCESS";
    payment.adminApproved = true;
    payment.verifiedAt = new Date();
    payment.approvedAt = new Date();
    
    try {
      await payment.save();
      await activatePaidSubscription(payment);
    } catch (saveErr) {
      console.error("DEV Verify Save Error:", saveErr);
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `DB Error: ${saveErr.message}`);
    }

    return {
      success: true,
      dev: true,
      subscriptionActivated: true,
      message: "Payment verified and subscription activated.",
    };
  }

  // PRODUCTION: strict signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Missing one or more payment verification fields from Razorpay.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid payment signature - authentication failed.");
  }

  payment.paymentId = razorpay_payment_id;
  payment.status = "SUCCESS";
  payment.adminApproved = true;
  payment.verifiedAt = new Date();
  payment.approvedAt = new Date();

  try {
    await payment.save();
    await activatePaidSubscription(payment);
  } catch (saveErr) {
    console.error("PROD Verify Save Error:", saveErr);
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `DB Error: ${saveErr.message}`);
  }

  return {
    success: true,
    subscriptionActivated: true,
    message: "Payment verified successfully and subscription activated.",
  };
};

// Called by admin to approve a verified payment and activate subscription


export const approvePaymentAndActivate = async (paymentId) => {
  // 1. Mark payment as successful and admin-approved
  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { status: "SUCCESS", adminApproved: true, approvedAt: new Date() },
    { new: true }
  );

  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");

  // 2. Activate the matching subscription in DB
  await activatePaidSubscription(payment);

  return payment;
};

// Called by admin to reject a pending payment
export const rejectPaymentByAdmin = async (paymentId, reason) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");

  if (payment.status !== "PENDING_APPROVAL") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Payment is in '${payment.status}' state and cannot be rejected`);
  }

  payment.status = "REJECTED";
  payment.adminApproved = false;
  payment.rejectionReason = reason || "Rejected by admin";
  payment.rejectedAt = new Date();
  await payment.save();

  return payment;
};

export const getPendingApprovalPayments = async () => {
  return Payment.find({ status: "PENDING_APPROVAL" })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};

// ✅ ADD FREE SUBSCRIPTION LOGIC
export const activateFreeSubscription = async (userId) => {
  const objUserId = new mongoose.Types.ObjectId(userId);

  const existingSub = await Subscription.findOne({
    userId: objUserId,
    status: "ACTIVE",
  });

  if (existingSub) {
    throw new ApiError(STATUS_CODES.CONFLICT, "You already have an active subscription");
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100);

  const subscription = await Subscription.findOneAndUpdate(
    { userId: objUserId },
    {
      plan: "FREE",
      status: "ACTIVE",
      price: 0,
      startDate,
      endDate,
      billingCycle: "ONE_TIME",
      paymentHistory: [{
        paymentId: `FREE_${Date.now()}`,
        amount: 0,
        paidAt: startDate,
        plan: "FREE",
      }],
    },
    { upsert: true, new: true }
  );

  return subscription;
};

export const getActiveSubscription = async (userId) => {
  return Subscription.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: "ACTIVE",
    endDate: { $gt: new Date() },
  }).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-topic (test series) one-time unlock — uses the topic's own price.
// Independent of the MONTHLY/YEARLY subscription bundle.
// ─────────────────────────────────────────────────────────────────────────────

export const userHasTopicAccess = async (userId, topicId) => {
  if (!userId || !topicId) return false;
  if (!mongoose.Types.ObjectId.isValid(topicId)) return false;
  const access = await TopicAccess.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    topicId: new mongoose.Types.ObjectId(topicId),
    disabled: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  return Boolean(access);
};

export const createTopicOrder = async (userId, topicId) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid topicId");
  }

  const topic = await TestSeriesTopic.findById(topicId).lean();
  if (!topic) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test series not found");
  }
  if (!topic.isPaid || !(topic.price > 0)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "This series is free");
  }

  // Already unlocked — no need to charge again.
  const already = await userHasTopicAccess(userId, topicId);
  if (already) {
    return { alreadyUnlocked: true };
  }

  const amount = sellingPrice(topic);
  let orderId;
  let razorpayOrderData = null;

  if (process.env.PAYMENT_MODE === "DEV") {
    orderId = `dev_topic_${Date.now()}_${userId}`;
  } else {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(STATUS_CODES.SERVER_ERROR, "Razorpay configuration missing");
    }
    try {
      razorpayOrderData = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `tpc_${Date.now().toString().slice(-8)}_${userId.toString().slice(-4)}`,
        notes: {
          userId: userId.toString(),
          topicId: topic._id.toString(),
          kind: "TOPIC",
        },
      });
      orderId = razorpayOrderData.id;
    } catch (err) {
      console.error("Razorpay topic order error:", err);
      throw new ApiError(
        STATUS_CODES.SERVER_ERROR,
        err.error?.description || "Failed to create order with payment gateway"
      );
    }
  }

  await Payment.create({
    userId,
    orderId,
    amount,
    kind: "TOPIC",
    refId: topic._id,
    description: `Test series unlock: ${topic.title}`,
    status: "PENDING",
  });

  return {
    orderId,
    amount,
    amountInPaise: Math.round(amount * 100),
    currency: "INR",
    topicId: topic._id.toString(),
    topicTitle: topic.title,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "DEV_KEY",
    ...(razorpayOrderData && { razorpayOrder: razorpayOrderData }),
  };
};

// Idempotently grant (or renew) a direct test-series unlock. Shared by the
// client verify endpoint, the Razorpay webhook, and the admin reconcile tool —
// so a paid order always unlocks regardless of which path confirms it.
export const fulfillTopicAccess = async (userId, topicId, { orderId = null, paymentId = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid topicId");
  }
  const topic = await TestSeriesTopic.findById(topicId).lean();
  if (!topic) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test series not found");
  }

  const existing = await TopicAccess.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    topicId: new mongoose.Types.ObjectId(topicId),
  });
  const now = new Date();
  const stillValid =
    existing && !existing.disabled && (!existing.expiresAt || existing.expiresAt > now);
  if (stillValid) {
    if (orderId) await Payment.findOneAndUpdate({ orderId }, { $set: { status: "SUCCESS", verifiedAt: new Date() } });
    return { alreadyProcessed: true, success: true };
  }

  const expiresAt = expiryFromMonths(topic.validityMonths);
  const pid = paymentId || `MANUAL_${Date.now()}`;

  if (existing) {
    // Renew/re-enable a previously expired or admin-revoked unlock on repayment.
    // A direct payment also promotes a course-unlocked row to an independent
    // DIRECT_PURCHASE so a later course expiry never revokes it.
    existing.disabled = false;
    existing.disabledAt = null;
    existing.status = "ACTIVE";
    existing.source = "DIRECT_PURCHASE";
    existing.sourceCourseId = null;
    existing.expiresAt = expiresAt;
    if (orderId) existing.orderId = orderId;
    existing.paymentId = pid;
    existing.amount = sellingPrice(topic);
    existing.currency = "INR";
    await existing.save();
  } else {
    await TopicAccess.create({
      userId: new mongoose.Types.ObjectId(userId),
      topicId: new mongoose.Types.ObjectId(topicId),
      orderId,
      paymentId: pid,
      amount: sellingPrice(topic),
      currency: "INR",
      source: "DIRECT_PURCHASE",
      status: "ACTIVE",
      expiresAt,
    });
  }

  if (orderId) await Payment.findOneAndUpdate({ orderId }, { $set: { status: "SUCCESS", paymentId: pid, verifiedAt: new Date() } });

  return { success: true, expiresAt };
};

export const verifyTopicPayment = async ({
  userId,
  topicId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid topicId");
  }
  if (!razorpay_order_id) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Order id is required");
  }

  if (process.env.PAYMENT_MODE !== "DEV") {
    if (!razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Missing payment verification fields");
    }
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid payment signature");
    }
  }

  const result = await fulfillTopicAccess(userId, topicId, {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id || `DEV_PAY_${Date.now()}`,
  });
  return { success: true, message: "Test series unlocked", ...result };
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-course one-time purchase — uses the course's own price + validityMonths.
// Mirrors the topic flow. Access lives in CourseAccess (see courses.service).
// ─────────────────────────────────────────────────────────────────────────────

export const userHasCourseAccess = async (userId, courseId) => {
  if (!userId || !courseId) return false;
  if (!mongoose.Types.ObjectId.isValid(courseId)) return false;
  const { default: CourseAccess } = await import("../../models/courseAccess.model.js");
  const access = await CourseAccess.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    courseId: new mongoose.Types.ObjectId(courseId),
    disabled: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  return Boolean(access);
};

const courseChargeAmount = (course) => sellingPrice(course);

export const createCourseOrder = async (userId, courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid courseId");
  }

  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");
  if (!course.isPaid || !(course.price > 0)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "This course is free");
  }

  // Already has valid access — no need to charge again.
  if (await userHasCourseAccess(userId, courseId)) {
    return { alreadyUnlocked: true };
  }

  const amount = courseChargeAmount(course);
  let orderId;
  let razorpayOrderData = null;

  if (process.env.PAYMENT_MODE === "DEV") {
    orderId = `dev_course_${Date.now()}_${userId}`;
  } else {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(STATUS_CODES.SERVER_ERROR, "Razorpay configuration missing");
    }
    try {
      razorpayOrderData = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `crs_${Date.now().toString().slice(-8)}_${userId.toString().slice(-4)}`,
        notes: {
          userId: userId.toString(),
          courseId: course._id.toString(),
          kind: "COURSE",
        },
      });
      orderId = razorpayOrderData.id;
    } catch (err) {
      console.error("Razorpay course order error:", err);
      throw new ApiError(
        STATUS_CODES.SERVER_ERROR,
        err.error?.description || "Failed to create order with payment gateway"
      );
    }
  }

  await Payment.create({
    userId,
    orderId,
    amount,
    kind: "COURSE",
    refId: course._id,
    description: `Course purchase: ${course.title}`,
    status: "PENDING",
  });

  return {
    orderId,
    amount,
    amountInPaise: Math.round(amount * 100),
    currency: "INR",
    courseId: course._id.toString(),
    courseTitle: course.title,
    validityMonths: course.validityMonths || 0,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "DEV_KEY",
    ...(razorpayOrderData && { razorpayOrder: razorpayOrderData }),
  };
};

export const verifyCoursePayment = async ({
  userId,
  courseId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid courseId");
  }
  if (!razorpay_order_id) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Order id is required");
  }

  if (process.env.PAYMENT_MODE !== "DEV") {
    if (!razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Missing payment verification fields");
    }
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid payment signature");
    }
  }

  const result = await fulfillCourseAccess(userId, courseId, {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id || `DEV_PAY_${Date.now()}`,
  });
  return { success: true, message: "Course unlocked", ...result };
};

// Idempotently grant a course purchase. Shared by verify, webhook and reconcile.
export const fulfillCourseAccess = async (userId, courseId, { orderId = null, paymentId = null } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid courseId");
  }
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(STATUS_CODES.NOT_FOUND, "Course not found");

  if (await userHasCourseAccess(userId, courseId)) {
    if (orderId) await Payment.findOneAndUpdate({ orderId }, { $set: { status: "SUCCESS", verifiedAt: new Date() } });
    return { alreadyProcessed: true, success: true };
  }

  const expiresAt = expiryFromMonths(course.validityMonths);
  const pid = paymentId || `MANUAL_${Date.now()}`;
  // grantCourseAccess upserts CourseAccess, resets the window, clears revoked state.
  await grantCourseAccess(userId, courseId, pid, expiresAt);
  if (orderId) await Payment.findOneAndUpdate({ orderId }, { $set: { status: "SUCCESS", paymentId: pid, verifiedAt: new Date() } });

  return { success: true, expiresAt };
};

// ─────────────────────────────────────────────────────────────────────────────
// Subscription / course / topic orders all carry routing info in their Razorpay
// `notes` (set at order creation). The webhook and the admin reconcile tool use
// these to grant the right access server-side, even if the browser callback that
// normally calls /verify never fires (tab closed, network drop, redirect flow).
// ─────────────────────────────────────────────────────────────────────────────

// Subscription orders are tracked in the Payment collection by orderId, so we
// activate by promoting that record (mirrors the /verify subscription path).
export const fulfillSubscriptionByOrderId = async (orderId, paymentId = null) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment order not found for subscription");
  }
  if (payment.status === "SUCCESS" && payment.adminApproved) {
    return { alreadyProcessed: true, success: true };
  }
  payment.paymentId = paymentId || payment.paymentId;
  payment.status = "SUCCESS";
  payment.adminApproved = true;
  payment.verifiedAt = payment.verifiedAt || new Date();
  payment.approvedAt = payment.approvedAt || new Date();
  await payment.save();
  await activatePaidSubscription(payment);
  return { success: true };
};

// Map a paid order's notes to the correct fulfillment. Idempotent end-to-end.
const routeOrderFulfillment = async (notes = {}, { orderId = null, paymentId = null } = {}) => {
  if (notes.kind === "TOPIC" && notes.topicId && notes.userId) {
    return fulfillTopicAccess(notes.userId, notes.topicId, { orderId, paymentId });
  }
  if (notes.kind === "COURSE" && notes.courseId && notes.userId) {
    return fulfillCourseAccess(notes.userId, notes.courseId, { orderId, paymentId });
  }
  if (notes.planId) {
    return fulfillSubscriptionByOrderId(orderId, paymentId);
  }
  throw new ApiError(STATUS_CODES.BAD_REQUEST, "Order notes do not map to any purchasable item");
};

// Verify the webhook HMAC (signed with the dashboard webhook secret, NOT the API
// key secret) over the RAW request body, then fulfill the paid order.
export const handleRazorpayWebhook = async (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiError(STATUS_CODES.SERVER_ERROR, "RAZORPAY_WEBHOOK_SECRET is not configured");
  }
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || "");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const sig = Buffer.from(signature || "", "utf8");
  const exp = Buffer.from(expected, "utf8");
  if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid webhook signature");
  }

  const event = JSON.parse(body.toString("utf8"));
  const type = event?.event;

  if (type === "order.paid") {
    const order = event.payload?.order?.entity || {};
    const payment = event.payload?.payment?.entity || {};
    await routeOrderFulfillment(order.notes || {}, {
      orderId: order.id || payment.order_id || null,
      paymentId: payment.id || null,
    });
    return { handled: true, event: type };
  }

  if (type === "payment.captured") {
    const payment = event.payload?.payment?.entity || {};
    const orderId = payment.order_id || null;
    let notes = payment.notes || {};
    // Notes are set on the order; the payment entity may not echo them.
    if ((!notes || !notes.kind) && orderId && razorpay) {
      try {
        const order = await razorpay.orders.fetch(orderId);
        notes = order?.notes || notes;
      } catch (e) {
        console.error("Webhook: could not fetch order notes:", e?.message);
      }
    }
    await routeOrderFulfillment(notes || {}, { orderId, paymentId: payment.id || null });
    return { handled: true, event: type };
  }

  return { handled: false, event: type };
};

// Client-side resume path: if the checkout `handler` never fired (closed tab,
// UPI app-switch inside an in-app browser losing its JS context), the
// frontend calls this on next load/focus with the orderId it stashed before
// opening checkout. Scoped to the owning user — unlike admin reconcile, this
// never accepts an arbitrary id from an unrelated caller.
export const checkAndResumeOrder = async (userId, orderId) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment || payment.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Order not found");
  }
  if (payment.status !== "PENDING") {
    return { fulfilled: true };
  }
  try {
    await reconcilePayment({ orderId });
    return { fulfilled: true };
  } catch (err) {
    if (/not paid yet/.test(err.message)) return { fulfilled: false };
    throw err;
  }
};

// Admin recovery: given a Razorpay paymentId or orderId, confirm it's actually
// paid at Razorpay, then grant the access it should have. Use this to rescue any
// payment that was taken but never unlocked (e.g. before the webhook existed).
export const reconcilePayment = async ({ paymentId = null, orderId = null }) => {
  if (!razorpay) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Reconcile is unavailable while PAYMENT_MODE=DEV");
  }
  let payment = null;
  if (paymentId) {
    payment = await razorpay.payments.fetch(paymentId);
    orderId = orderId || payment.order_id;
  }
  if (!orderId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Provide a Razorpay paymentId or orderId");
  }
  const order = await razorpay.orders.fetch(orderId);
  const paid = order?.status === "paid" || (payment && payment.status === "captured");
  if (!paid) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Order ${orderId} is not paid yet (status: ${order?.status})`
    );
  }
  const result = await routeOrderFulfillment(order.notes || {}, {
    orderId,
    paymentId: paymentId || payment?.id || null,
  });
  return { success: true, orderId, notes: order.notes || {}, ...result };
};
