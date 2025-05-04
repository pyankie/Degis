import { Types } from "mongoose";
import { KycRequest } from "../models/kycRequest";

export const creatKycRequest = async (
  userId: string,
  documentUrl: string,
  rejectionReason?: string,
) => {
  const req = new KycRequest({
    userId: new Types.ObjectId(userId),
    documentUrl,
    rejectionReason,
  });

  return await req.save();
};

export const getKycRequestById = async (id: string) => {
  const _id = new Types.ObjectId(id);
  return await KycRequest.findById(_id);
};

export const getKycRequestByUser = async (userId: string) => {
  const _id = new Types.ObjectId(userId);
  return await KycRequest.find({
    userId: _id,
  });
};
