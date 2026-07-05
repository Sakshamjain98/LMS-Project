import mongoose from "mongoose";
import dotenv from "dotenv";
import Test from "../src/models/test.model.js";
import Question from "../src/models/question.model.js";
import { sumQuestionMarks } from "../src/shared/utils/evaluation.utils.js";

dotenv.config();

const isApplyMode = process.argv.includes("--apply");
const dryRun = !isApplyMode;

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment");
  }
  await mongoose.connect(process.env.MONGO_URI);
};

const run = async () => {
  try {
    await connect();

    console.log(`Backfill mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);

    const tests = await Test.find().select("_id title totalMarks").lean();
    let staleCount = 0;

    for (const test of tests) {
      const questions = await Question.find({ testId: test._id }).select("marks").lean();
      const correctTotal = sumQuestionMarks(questions);

      if (correctTotal !== (test.totalMarks || 0)) {
        staleCount++;
        console.log(
          `Test "${test.title}" (${test._id}): totalMarks ${test.totalMarks || 0} -> ${correctTotal}`
        );
        if (!dryRun) {
          await Test.updateOne({ _id: test._id }, { $set: { totalMarks: correctTotal } });
        }
      }
    }

    console.log(`Checked ${tests.length} tests. Stale: ${staleCount}.`);
    if (dryRun && staleCount) {
      console.log("Dry-run complete. Re-run with --apply to fix these tests.");
    }
  } catch (error) {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
