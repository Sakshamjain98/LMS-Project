import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import Test from "../src/models/test.model.js";

// Regression test for a bug where AITS tests were created with aitsId silently
// dropped: a second, stale Test schema (backend/src/modules/test/test.model.js,
// now deleted) had no `aitsId` path. Because mongoose only compiles a model
// once per name, whichever file ran `mongoose.model("Test", ...)` first won
// for the whole process — and Test.create({ aitsId }) silently stripped the
// field for every caller, app-wide, since the compiled schema didn't know it.
describe("Test model — aitsId persistence", () => {
  it("declares an aitsId path on the schema", () => {
    expect(Test.schema.path("aitsId")).toBeDefined();
  });

  it("keeps aitsId set when constructing an AITS-type test", () => {
    const aitsId = new mongoose.Types.ObjectId();
    const teacherId = new mongoose.Types.ObjectId();

    const doc = new Test({
      title: "AITS Round 1",
      teacherId,
      aitsId,
      type: "aits",
      chapterId: null,
      subjectId: null,
      topicId: null,
    });

    expect(doc.aitsId?.toString()).toBe(aitsId.toString());
  });

  it("only ever registers one compiled Test model for the process", () => {
    // Re-importing the module must return the same compiled model, not a
    // second mongoose.model("Test", ...) call racing against this one.
    expect(mongoose.models.Test).toBe(Test);
  });
});
