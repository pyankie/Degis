import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { upload } from "../services/uploadService";
import { creatKycRequest as creatKyc } from "../services/kycReqestService";
import _ from "lodash";

export const creatKycRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const file = req.file!;
  const userId = req.user!._id;

  try {
    const { fileDoc } = await upload(file, userId);

    if (!fileDoc) {
      res.status(400).json({
        success: false,
        message: "Faild to create kyc request",
      });
      return;
    }

    const kycDoc = await creatKyc(userId, fileDoc.fileUrl);
    const filteredDoc = _.pick(kycDoc.toObject(), [
      "status",
      "userId",
      "_id",
      "documentUrl",
      "submittedAt",
    ]);
    res.json({ success: true, data: filteredDoc });
  } catch (err: any) {
    next(new Error(err.message));
  }
};
