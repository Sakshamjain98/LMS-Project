import express from "express";
import * as adminService from "../admin/admin.service.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import News from "../../models/news.model.js";

const router = express.Router();

// Public site content for the landing page (CMS-managed by admin).
router.get(
  "/site-content",
  asyncHandler(async (_req, res) => {
    const data = await adminService.getSiteContent();
    res.json({ success: true, data });
  })
);


// Public list of published blogs/articles for the landing page
router.get(
  "/blogs",
  asyncHandler(async (req, res) => {
    const result = await adminService.getBlogs({
      published: true,
      limit: req.query.limit || 12,
      page: req.query.page || 1,
    });
    res.json({ success: true, ...result });
  })
);

// Public list of published news for the landing page
router.get(
  "/news",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 50);
    const news = await News.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, news });
  })
);

export default router;
