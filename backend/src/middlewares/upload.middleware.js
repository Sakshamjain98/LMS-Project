import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      const isCSV = file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel";
      // Accept PDF by MIME type OR by file extension (some browsers send octet-stream)
      const isPDF =
        file.mimetype === "application/pdf" ||
        file.originalname?.toLowerCase().endsWith(".pdf");
      const isImage = file.mimetype.startsWith("image/");
      const isCourseRoute = req.originalUrl?.includes("/courses");

      // Sanitise base name and preserve original extension in the public_id.
      // For raw resource_type, Cloudinary serves the file at a URL that includes
      // the extension only when the public_id itself includes it — so we always
      // include it here to guarantee a usable URL.
      const ext = file.originalname?.split(".").pop()?.toLowerCase() || "";
      const baseName = (file.originalname?.split(".").slice(0, -1).join("_") || "file")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 60);
      // public_id with extension ensures the CDN URL is fetchable without guessing
      const publicId = ext ? `${Date.now()}-${baseName}.${ext}` : `${Date.now()}-${baseName}`;

      let folder = "pharmacist-shubham/others";
      let resource_type = "auto";

      if (isCSV) {
        folder = "pharmacist-shubham/test-csvs";
        resource_type = "raw";
      } else if (isCourseRoute && isPDF) {
        folder = "pharmacist-shubham/course-notes";
        resource_type = "raw";
      } else if (isCourseRoute && isImage) {
        folder = "pharmacist-shubham/course-thumbnails";
        resource_type = "image";
      } else if (isPDF) {
        folder = "pharmacist-shubham/pdfs";
        resource_type = "raw";
      }

      // Never set `format` for raw resource_type — it is only valid for
      // image/video types and will cause the upload to fail for raw files.
      return { folder, resource_type, public_id: publicId };
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