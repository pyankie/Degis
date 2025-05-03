import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid image type. Only [image/jpeg, image/png] are allowed.",
      ),
    );
  }
};
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});
