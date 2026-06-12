import cron from "node-cron";
import CourseAccess from "../../models/courseAccess.model.js";
import TopicAccess from "../../models/topicAccess.model.js";
import Subscription from "../../models/subscription.model.js";
import logger from "../logger/logger.js";

/**
 * Sweep all access records and flip stored status ACTIVE → EXPIRED where the
 * access window has lapsed. Real-time access checks already treat a passed
 * `expiresAt` as expired, so this job only keeps the *stored* status accurate
 * for admin reporting/filtering — correctness never depends on it running.
 *
 * Also a safety-net: COURSE_UNLOCK test-series rows whose source course access
 * is gone/expired are marked EXPIRED + disabled so they can't linger active.
 *
 * Exported as a plain function so it can be run manually (scripts/tests).
 */
export const runExpirySweep = async () => {
  const now = new Date();
  const lapsed = { expiresAt: { $ne: null, $lte: now }, status: "ACTIVE" };

  const [courseRes, topicRes, subRes] = await Promise.all([
    CourseAccess.updateMany(lapsed, { $set: { status: "EXPIRED" } }),
    TopicAccess.updateMany(lapsed, { $set: { status: "EXPIRED" } }),
    Subscription.updateMany(
      { plan: { $ne: "FREE" }, endDate: { $ne: null, $lte: now }, status: "ACTIVE" },
      { $set: { status: "EXPIRED" } }
    ),
  ]);

  // Safety-net: COURSE_UNLOCK rows pointing at a course the user no longer has
  // active access to. Build the set of (userId, courseId) pairs still active,
  // then expire any COURSE_UNLOCK row outside it.
  const activeCourse = await CourseAccess.find({
    disabled: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select("userId courseId")
    .lean();
  const activePairs = new Set(activeCourse.map((a) => `${a.userId}_${a.courseId}`));

  const courseUnlocks = await TopicAccess.find({
    source: "COURSE_UNLOCK",
    sourceCourseId: { $ne: null },
    status: "ACTIVE",
  })
    .select("_id userId sourceCourseId")
    .lean();

  const orphanIds = courseUnlocks
    .filter((t) => !activePairs.has(`${t.userId}_${t.sourceCourseId}`))
    .map((t) => t._id);

  let orphanRes = { modifiedCount: 0 };
  if (orphanIds.length) {
    orphanRes = await TopicAccess.updateMany(
      { _id: { $in: orphanIds } },
      { $set: { status: "EXPIRED", disabled: true, disabledAt: now } }
    );
  }

  const summary = {
    courseAccessExpired: courseRes.modifiedCount,
    topicAccessExpired: topicRes.modifiedCount,
    subscriptionsExpired: subRes.modifiedCount,
    orphanCourseUnlocksRevoked: orphanRes.modifiedCount,
  };
  logger.info("Expiry sweep complete", summary);
  return summary;
};

/**
 * Schedule the daily sweep (02:00 server time). Call once on server boot.
 */
export const startExpirySweepJob = () => {
  cron.schedule("0 2 * * *", () => {
    runExpirySweep().catch((err) =>
      logger.error("Expiry sweep failed", { error: err.message })
    );
  });
  logger.info("Expiry sweep cron scheduled (daily 02:00)");
};

export default startExpirySweepJob;
