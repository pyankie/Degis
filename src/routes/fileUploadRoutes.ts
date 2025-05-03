import express, { Request } from "express";
import { upload as uploadMiddleware } from "../middlewares/upload";
import { upload } from "../controllers/uploadService";
import { auth, AuthRequest } from "../middlewares/auth";

const router = express.Router();

router.post(
  "/",
  auth,
  uploadMiddleware.single("coverImage"),
  async (req: AuthRequest, res, next) => {
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
