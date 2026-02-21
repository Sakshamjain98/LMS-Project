import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      let folder = "pharmacist-shubham/others";
      if (file.mimetype.startsWith("image")) {
        folder = "pharmacist-shubham/course-images";
      }
      if (file.mimetype === "application/pdf") {
        folder = "pharmacist-shubham/notes";
      }
      return { folder, resource_type: "auto" };
    } catch (error) {
      console.error("Cloudinary params error:", error);
      throw error;
    }
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});