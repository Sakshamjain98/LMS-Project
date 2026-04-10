import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      const isCSV = file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel";
      
      return {
        folder: isCSV ? "pharmacist-shubham/test-csvs" : "pharmacist-shubham/others",
        // CRITICAL: CSV must be 'raw'. 'auto' often fails for CSVs on Cloudinary
        resource_type: isCSV ? "raw" : "auto", 
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      };
    } catch (error) {
      console.error("Cloudinary Params Error:", error);
      throw error;
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg", 
    "image/png", 
    "image/webp", 
    "application/pdf", 
    "text/csv", 
    "application/vnd.ms-excel",
    "application/octet-stream",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // If this error isn't caught by a global handler, the server crashes
    const error = new Error("Invalid file type. Only Images, PDFs, and CSVs are supported.");
    error.code = "LIMIT_FILE_TYPES"; 
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});