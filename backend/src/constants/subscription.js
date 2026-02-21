export const SUBSCRIPTION_PLANS = Object.freeze({
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    duration: null, // unlimited
    features: [
      "Access to free courses",
      "Access to free notes",
      "Read blogs",
    ],
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly Premium",
    price: 299,
    duration: 30, // days
    features: [
      "Access to all courses",
      "Access to all notes & PDFs",
      "All tests & mock exams",
      "Priority support",
      "Download materials",
    ],
  },
  QUARTERLY: {
    id: "QUARTERLY",
    name: "Quarterly Premium",
    price: 799,
    duration: 90, // days
    discount: 11, // percentage saved vs monthly
    features: [
      "All Monthly features",
      "Save 11% compared to monthly",
    ],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Yearly Premium",
    price: 2499,
    duration: 365, // days
    discount: 30, // percentage saved vs monthly
    features: [
      "All Monthly features",
      "Save 30% compared to monthly",
      "Early access to new content",
    ],
  },
});

export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  PENDING: "PENDING",
});

export const BILLING_CYCLE = Object.freeze({
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
  ONE_TIME: "ONE_TIME",
});
