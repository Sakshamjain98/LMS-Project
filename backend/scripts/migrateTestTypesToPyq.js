import mongoose from "mongoose";
import dotenv from "dotenv";
import Test from "../src/models/test.model.js";

dotenv.config();

const isApplyMode = process.argv.includes("--apply");
const forceAllMissing = process.argv.includes("--force-all-missing");
const dryRun = !isApplyMode;

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment");
  }
  await mongoose.connect(process.env.MONGO_URI);
};

const buildFilter = () => {
  const pyqSignalRegex = /(\bpyq\b|past[\s-]?year|previous[\s-]?year)/i;
  const pyqSignalInText = {
    $or: [
      { title: pyqSignalRegex },
      { description: pyqSignalRegex },
      { instructions: pyqSignalRegex },
    ],
  };

  const missingTypeFilter = forceAllMissing
    ? {
        $or: [
          { type: { $exists: false } },
          { type: null },
          { type: "" },
        ],
      }
    : {
        $or: [
          { type: { $exists: false }, ...pyqSignalInText },
          { type: null, ...pyqSignalInText },
          { type: "", ...pyqSignalInText },
        ],
      };

  return {
    $or: [
      { type: "PYQ" },
      missingTypeFilter,
    ],
  };
};

const run = async () => {
  try {
    await connect();

    const filter = buildFilter();
    const totalCandidates = await Test.countDocuments(filter);

    console.log(`Migration mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);
    console.log(`Missing-type strategy: ${forceAllMissing ? "force all missing" : "only PYQ-signaled missing"}`);
    console.log(`Candidate tests to convert: ${totalCandidates}`);

    if (!totalCandidates) {
      console.log("No legacy test types found. Nothing to migrate.");
      return;
    }

    if (dryRun) {
      const sample = await Test.find(filter)
        .select("_id title type")
        .limit(10)
        .lean();
      console.log("Sample candidates:", sample);
      console.log("Dry-run complete. Re-run with --apply to perform updates.");
      if (!forceAllMissing) {
        console.log("Tip: add --force-all-missing only if you are certain every missing type should become pyq.");
      }
      return;
    }

    const result = await Test.updateMany(filter, { $set: { type: "pyq" } });
    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
