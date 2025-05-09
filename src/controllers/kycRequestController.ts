import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { upload } from "../services/uploadService";
import {
  creatKycRequest as creatKyc,
  getKycRequestById,
} from "../services/kycReqestService";
import _ from "lodash";
import { kycRequestStatusSchema } from "../schemas/kycStatus.schema";
import { Types } from "mongoose";
import objectIdSchema from "../utils/objectIdValidator";
import { kycQuerySchema } from "../schemas/query.schema";
import { getKycRequests } from "../services/adminService";

export default class KycRequestController {
  static creatKycRequest = async (
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

  static getKycRequests = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsePagination = kycQuerySchema.safeParse(req.query);

      if (!parsePagination.success) {
        res.status(400).json({
          success: false,
          message: parsePagination.error.errors[0].message,
        });
        return;
      }
      const pagination = parsePagination.data;

      const requests = await getKycRequests(pagination);
      if (!requests || !requests.length) {
        res.status(404).json({
          success: false,
          message: "No kyc request found",
        });
      }

      res.json({
        success: true,
        data: requests.map((request) =>
          _.omit(request.toObject(), ["__v", "userId"]),
        ),
        pagination: {
          page: pagination.page ?? 1,
          pageSize: pagination.pageSize ?? 10,
          status: pagination.status ?? "pending",
        },
      });
    } catch (err: any) {
      next(new Error(err.message));
    }
  };
  static verifyKycRequest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parseKycStatus = kycRequestStatusSchema.safeParse(req.body);
      const parseKycRequestId = objectIdSchema.safeParse(req.params.id);

      if (!parseKycStatus.success || !parseKycRequestId.success) {
        const errors = [
          ...(parseKycStatus.error?.errors.map((e) => e.message) || []),
          ...(parseKycRequestId.error?.errors.map((e) => e.message) || []),
        ].filter(Boolean);

        res.status(400).json({
          success: false,
          message: errors.join("; "),
        });
        return;
      }

      const { status, reason } = parseKycStatus.data;

      const kycDoc = await getKycRequestById(parseKycRequestId.data);
      if (!kycDoc) {
        res.status(404).json({
          success: false,
          message: "KYC doc not found",
        });
        return;
      }

      kycDoc.status = status;
      kycDoc.reviewerId = new Types.ObjectId(req.user!._id);
      kycDoc.reviewedAt = new Date();

      if (status === "rejected")
        kycDoc.rejectionReason = reason || "reason not found";
      else kycDoc.rejectionReason = undefined;

      const reviewedDoc = await kycDoc.save();

      res
        .status(201)
        .json({ success: true, data: _.omit(reviewedDoc.toObject(), ["__v"]) });
    } catch (err: any) {
      next(new Error(err.message));
    }
  };
}
