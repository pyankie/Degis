import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/errors/appError";

const createFileFilter = (fieldName: string) => {
  let allowedTypes;
  if (fieldName === "coverImage") allowedTypes = ["image/jpeg", "image/png"];
  else allowedTypes = ["application/pdf", "application/octet-stream"];

  const filter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
          400,
        ),
      );
    }

    cb(null, true);
  };

  return filter;
};

const storage = multer.memoryStorage();

export const creatUploadMiddleware = (fieldName: string) => {
  return multer({
    storage,
    fileFilter: createFileFilter(fieldName),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  }).single(fieldName);
};
