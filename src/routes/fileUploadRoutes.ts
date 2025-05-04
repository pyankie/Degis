import express, { NextFunction, Response } from "express";
import { creatUploadMiddleware } from "../middlewares/upload";
import { upload } from "../services/uploadService";
import { auth, AuthRequest } from "../middlewares/auth";
import { multerErrorMiddleware } from "../middlewares/error";

const router = express.Router();

router.post(
  "/",
  auth,
  creatUploadMiddleware("coverImage"),
  multerErrorMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const file = req.file!;
    const userId = req.user!._id;

    try {
      const uploadStatus = await upload(file, userId);
      if (!uploadStatus) {
        res.status(500).json({
          success: false,
          message: "Faild to upload file",
        });
        return;
      }

      const { fileDoc, key } = uploadStatus;
      const responseUrl = fileDoc.fileUrl;

      res.status(201).json({
        success: true,
        data: { ...fileDoc.toJSON(), fileUrl: responseUrl },
      });
    } catch (err: any) {
      next(new Error(err.message));
    }
  },
);

export default router;
