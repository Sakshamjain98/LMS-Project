import express from "express";
import * as controller from "./examCategory.controller.js";

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:categoryId", controller.getById);
router.post("/", controller.create);
router.put("/:categoryId", controller.update);
router.delete("/:categoryId", controller.remove);

export default router;
