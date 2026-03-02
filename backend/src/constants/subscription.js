export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    duration: null, // unlimited
    features: ["free_courses", "free_notes"],
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly",
    price: 499, // example price
    duration: 30, // days
    features: ["all_courses", "all_notes", "premium_support"],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Yearly",
    price: 3999, // example
    duration: 365,
    features: ["all_courses", "all_notes", "premium_support", "discount"],
  },
};

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
