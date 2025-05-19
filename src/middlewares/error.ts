import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors/appError";
import { MulterError } from "multer";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    console.error("SyntaxError:", err.message);
    res.status(400).json({ success: false, message: "Invalid JSON payload" });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error." });
  return;
};

export const multerErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return next(new AppError(`${err.message}`, err.statusCode));
  }
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new AppError(`Unexpeced field ${err.field}`, 400));
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File size exceeds 1MB limit", 400));
    }
  }
  next(err.message);
};
