import mongoose from "mongoose";
import dotenv from "dotenv";
import ExamCategory from "../src/models/examCategory.model.js";
import Exam from "../src/models/exam.model.js";
import Course from "../src/models/course.model.js";
import CourseSubject from "../src/models/courseSubject.model.js";
import CourseChapter from "../src/models/courseChapter.model.js";
import CourseNote from "../src/models/courseNote.model.js";
import CourseVideo from "../src/models/courseVideo.model.js";
import TestSeriesTopic from "../src/models/testSeriesTopic.model.js";
import TestSeriesSubject from "../src/models/testSeriesSubject.model.js";
import TestSeriesChapter from "../src/models/testSeriesChapter.model.js";
import Test from "../src/models/test.model.js";
import AllIndiaTestSeries from "../src/models/allIndiaTestSeries.model.js";

dotenv.config();

const isApplyMode = process.argv.includes("--apply");
const dryRun = !isApplyMode;

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment");
  }
  await mongoose.connect(process.env.MONGO_URI);
};

// Every sibling group that needs a stable initial `order` so old rows don't
// all collide at the schema default of 0. Grouped by their parent scope field
// (or null for flat top-level lists), ordered by createdAt.
const GROUPS = [
  { Model: ExamCategory, scopeField: null },
  { Model: Exam, scopeField: "examCategoryId" },
  { Model: Course, scopeField: "examId" },
  { Model: CourseSubject, scopeField: "courseId" },
  { Model: CourseChapter, scopeField: "subjectId" },
  { Model: CourseNote, scopeField: "chapterId" },
  { Model: CourseVideo, scopeField: "chapterId" },
  { Model: TestSeriesTopic, scopeField: "examId" },
  { Model: TestSeriesSubject, scopeField: "topicId" },
  { Model: TestSeriesChapter, scopeField: "subjectId" },
  { Model: Test, scopeField: "chapterId" },
  { Model: AllIndiaTestSeries, scopeField: "examId" },
];

const run = async () => {
  try {
    await connect();
    console.log(`Backfill mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);

    for (const { Model, scopeField } of GROUPS) {
      const docs = await Model.find().select(`_id order createdAt ${scopeField || ""}`).sort({ createdAt: 1 }).lean();
      const groups = new Map();
      docs.forEach((doc) => {
        const key = scopeField ? String(doc[scopeField] || "null") : "all";
        const list = groups.get(key) || [];
        list.push(doc);
        groups.set(key, list);
      });

      const ops = [];
      groups.forEach((siblings) => {
        siblings.forEach((doc, index) => {
          if (doc.order !== index) {
            ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { order: index } } } });
          }
        });
      });

      console.log(`${Model.modelName}: ${ops.length} of ${docs.length} need an order backfill`);
      if (!dryRun && ops.length) {
        await Model.bulkWrite(ops);
      }
    }

    if (dryRun) {
      console.log("Dry-run complete. Re-run with --apply to write these changes.");
    }
  } catch (error) {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
