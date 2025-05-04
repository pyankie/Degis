import mongoose, { Schema, model } from "mongoose";

interface IKycRequest {
  userId: mongoose.Types.ObjectId;
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const kycRequestSchema = new Schema<IKycRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    documentUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

export const KycRequest = model<IKycRequest>("KycRequest", kycRequestSchema);
