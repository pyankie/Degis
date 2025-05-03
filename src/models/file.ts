import mongoose, { Schema, Types } from "mongoose";

export interface IFile extends Document {
  userId: Types.ObjectId;
  eventId?: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  type: "image" | "kyc";
  size: number;
  uploadedAt: Date;
  verified?: boolean;
}

const fileSchema = new Schema<IFile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event" },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  type: { type: String, enum: ["image", "kyc"], required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
});

export const File = mongoose.model<IFile>("File", fileSchema);
