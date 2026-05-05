import mongoose from "mongoose";

/**
 * Singleton document holding all editable landing-page content.
 * We keep it as a single JSON blob (`data: Mixed`) so the schema can evolve
 * without migrations as the admin UI adds new fields.
 *
 * Always read/write via `key: "singleton"` and use upsert.
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, default: "singleton", unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("SiteContent", siteContentSchema);
