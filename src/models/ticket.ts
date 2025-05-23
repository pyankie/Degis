import mongoose, { Schema, model } from "mongoose";

export interface ITicket {
  userId: mongoose.Types.ObjectId; // ticket ownser
  eventId: mongoose.Types.ObjectId;
  type: "standard" | "vip" | "early_bird";
  price: number; // 0 for free events
  qrCode: string;
  paymentStatus: "pending" | "completed" | "failed";
  transactionRef: string;
  status: "active" | "used" | "transferred";
  originalOwnerId?: mongoose.Types.ObjectId; // for trackingf transfer
  createdAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    type: {
      type: String,
      // enum: ["standard", "vip", "early_bird"],
      enum: ["standard", "vip"],
      default: "standard",
    },
    price: { type: Number, required: true },
    qrCode: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["active", "used", "transferred"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionRef: { type: String, required: true },
    originalOwnerId: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
ticketSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Ticket = model<ITicket>("Ticket", ticketSchema);
