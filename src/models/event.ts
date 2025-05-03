import mongoose, { Document } from "mongoose";

// (form payload)
export interface IEvent {
  title: string;
  description: string;
  date: Date;
  startDate: Date;
  endDate: Date;
  venue: string;
  isFree: boolean;
  ticketTypes?: ITicketType[];
  capacity: number;
  category: string;
  coverImage?: string;
  isPrivate: boolean;
}

interface ITicketType {
  name: string;
  price: number;
  capacity?: number;
}
//  mongoose document
interface IEventDocument extends IEvent, Document {
  slug: string;
  organizerId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "live" | "completed";
  ticketsSold: number;
  invitees?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<IEventDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    venue: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "cinema",
        "educational",
        "theater",
        "discourse",
        "weg",
        "comedy",
        "webinar",
      ],
      required: true,
    },
    date: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isFree: { type: Boolean, default: true },
    ticketTypes: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        capacity: { type: Number },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "live", "completed"],
      default: "pending",
    },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    invitees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    coverImage: { type: String },
  },
  { timestamps: true },
);

export const Event = mongoose.model<IEventDocument>("Event", eventSchema);
