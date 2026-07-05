import mongoose from "mongoose";
import dotenv from "dotenv";
import Test from "../src/models/test.model.js";
import TestAttempt from "../src/models/testAttempt.model.js";

dotenv.config();

const isApplyMode = process.argv.includes("--apply");
const dryRun = !isApplyMode;

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment");
  }
  await mongoose.connect(process.env.MONGO_URI);
};

// Run AFTER backfillTestTotalMarks.js --apply, so Test.totalMarks is already
// correct here — this just propagates it into attempts that snapshotted the
// stale value at start time and never got it recomputed.
const run = async () => {
  try {
    await connect();
    console.log(`Backfill mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);

    const attempts = await TestAttempt.find({ status: { $in: ["submitted", "evaluated"] } })
      .select("_id testId totalMarks marksObtained percentage")
      .lean();

    const testIds = [...new Set(attempts.map((a) => String(a.testId)))];
    const tests = await Test.find({ _id: { $in: testIds } }).select("_id totalMarks").lean();
    const totalMarksByTest = new Map(tests.map((t) => [String(t._id), t.totalMarks || 0]));

    let staleCount = 0;
    for (const attempt of attempts) {
      const correctTotal = totalMarksByTest.get(String(attempt.testId));
      if (correctTotal === undefined || correctTotal === (attempt.totalMarks || 0)) continue;

      const correctPercentage = correctTotal > 0
        ? Math.round((attempt.marksObtained / correctTotal) * 100 * 100) / 100
        : 0;

      staleCount++;
      console.log(
        `Attempt ${attempt._id}: totalMarks ${attempt.totalMarks || 0} -> ${correctTotal}, ` +
        `percentage ${attempt.percentage || 0} -> ${correctPercentage}`
      );

      if (!dryRun) {
        await TestAttempt.updateOne(
          { _id: attempt._id },
          { $set: { totalMarks: correctTotal, percentage: correctPercentage } }
        );
      }
    }

    console.log(`Checked ${attempts.length} attempts. Stale: ${staleCount}.`);
    if (dryRun && staleCount) {
      console.log("Dry-run complete. Re-run with --apply to fix these attempts.");
    }
  } catch (error) {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
