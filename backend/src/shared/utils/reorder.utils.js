import { ApiError } from "../error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

/**
 * Bulk drag-and-drop reorder, shared by every sortable admin table.
 * Validates the submitted id set exactly matches the existing documents in
 * `scopeFilter` before writing, so a stale/foreign id can't reorder or leak
 * rows outside their scope (same safety check the original chapters reorder
 * endpoint established).
 */
export async function reorderItems(Model, scopeFilter, ids) {
  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "ids array is required");
  }
  const docs = await Model.find(scopeFilter).select("_id").lean();
  const validIds = new Set(docs.map((d) => d._id.toString()));
  if (ids.some((id) => !validIds.has(String(id))) || ids.length !== docs.length) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "ids must match the existing items in this scope");
  }
  await Model.bulkWrite(
    ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } }))
  );
  return Model.find(scopeFilter).sort({ order: 1 }).lean();
}
