import { KycRequest } from "../models/kycRequest";
import { kycQuerySchema } from "../schemas/query.schema";
import z from "zod";

type Query = z.infer<typeof kycQuerySchema>;
export const getKycRequests = async (pagination: Query) => {
  const { page = 1, pageSize = 10, status = "pending" } = pagination;

  const skip = (page - 1) * pageSize;

  return await KycRequest.find({ status }).skip(skip).limit(pageSize);
};
