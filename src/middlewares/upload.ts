import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/errors/appError";

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png"];

  if (file.size > 2 * 1024 * 1024)
    cb(new AppError("File too large. File size must be less than 2MB", 400));

  if (!allowedTypes.includes(file.mimetype)) {
    cb(
      new Error(
        "Invalid image type. Only [image/jpeg, image/png] are allowed.",
      ),
    );
  }

  cb(null, true);
};

const storage = multer.memoryStorage();

export const creatUploadMiddleware = (fieldName: string) => {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  }).single(fieldName);
};
