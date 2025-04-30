import mongoose from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "invite" | "reminder" | "update";
  eventId: mongoose.Types.ObjectId;
  message: string;
  link?: string;
  status: "unread" | "read";
  createdAt: Date;
}

export const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["invite", "reminder", "update"],
      required: true,
    },
    message: { type: String, required: true },
    link: String,
    status: { type: String, enum: ["read", "unread"], default: "unread" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
