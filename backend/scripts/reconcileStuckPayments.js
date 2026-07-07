import "../src/config/env.js"; // must load first: populates process.env before razorpay.js reads it
import mongoose from "mongoose";
import { runPaymentReconcileSweep } from "../src/infrastucture/jobs/paymentReconcileSweep.job.js";

const isApplyMode = process.argv.includes("--apply");
const dryRun = !isApplyMode;

const run = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set in environment");
    await mongoose.connect(process.env.MONGO_URI);

    console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);
    const summary = await runPaymentReconcileSweep({ dryRun });
    console.log("Summary:", summary);

    if (dryRun && summary.fulfilled > 0) {
      console.log(`${summary.fulfilled} order(s) are paid at Razorpay but not yet fulfilled locally.`);
      console.log("Re-run with --apply to grant access for them.");
    }
  } catch (error) {
    console.error("Reconcile sweep failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
