import mongoose from "mongoose";

export interface IEventInvitation extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  createdAt: Date;
  expiresAt: Date;
}

const eventInvitationSchema = new mongoose.Schema<IEventInvitation>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

eventInvitationSchema.index({ email: 1, eventId: 1 }, { unique: true });

export const EventInvitation = mongoose.model<IEventInvitation>(
  "EventInvitation",
  eventInvitationSchema,
);
