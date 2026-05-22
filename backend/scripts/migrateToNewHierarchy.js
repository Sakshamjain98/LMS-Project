/**
 * Migration: Introduce ExamCategory + Exam + type field on Test
 *
 * What this does:
 *  1. Creates a "General" ExamCategory (idempotent — skips if already exists).
 *  2. Creates a "General Exam" under that category (idempotent).
 *  3. Assigns all TestSeriesTopic docs with no examId to the new exam.
 *  4. Sets type = "practice" on all Test docs that have no type set yet.
 *
 * Run once after deploying the new models:
 *   node backend/scripts/migrateToNewHierarchy.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import ExamCategory from "../src/models/examCategory.model.js";
import Exam from "../src/models/exam.model.js";
import TestSeriesTopic from "../src/models/testSeriesTopic.model.js";
import Test from "../src/models/test.model.js";

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("✗ MONGO_URI not found in environment. Aborting.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  // ── 1. Upsert default ExamCategory ────────────────────────────────────────
  let category = await ExamCategory.findOne({ slug: "general" });
  if (!category) {
    category = await ExamCategory.create({
      title: "General",
      slug: "general",
      description: "Default category for all existing test series.",
      order: 0,
    });
    console.log(`✓ Created ExamCategory: "${category.title}" (${category._id})`);
  } else {
    console.log(`→ ExamCategory already exists: "${category.title}" (${category._id})`);
  }

  // ── 2. Upsert default Exam ─────────────────────────────────────────────────
  let exam = await Exam.findOne({ slug: "general-exam" });
  if (!exam) {
    exam = await Exam.create({
      title: "General Exam",
      slug: "general-exam",
      description: "Default exam for all existing test series topics.",
      examCategoryId: category._id,
      order: 0,
    });
    console.log(`✓ Created Exam: "${exam.title}" (${exam._id})`);
  } else {
    console.log(`→ Exam already exists: "${exam.title}" (${exam._id})`);
  }

  // ── 3. Assign orphan topics to the default exam ───────────────────────────
  const topicResult = await TestSeriesTopic.updateMany(
    { examId: { $in: [null, undefined] } },
    { $set: { examId: exam._id } }
  );
  console.log(`✓ Assigned ${topicResult.modifiedCount} TestSeriesTopic(s) to default exam.`);

  // ── 4. Set type = "practice" on tests that have no type ───────────────────
  const testResult = await Test.updateMany(
    { type: { $in: [null, undefined] } },
    { $set: { type: "practice" } }
  );
  console.log(`✓ Set type="practice" on ${testResult.modifiedCount} Test(s).`);

  await mongoose.disconnect();
  console.log("✓ Done. Migration complete.");
}

run().catch((err) => {
  console.error("✗ Migration failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
