import mongoose, { Document, model } from "mongoose";
import { z } from "zod";

// (form payload)
interface IEvent {
  title: string;
  description: string;
  date: Date;
  startDate: Date;
  endDate: Date;
  venue: string;
  isFree: boolean;
  price?: number;
  capacity: number;
  category: string;
  coverImage?: string;
  isPrivate: boolean;
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
    price: {
      type: Number,
      required: function () {
        return !this.isFree;
      },
    },
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

const eventPostSchema = z
  .object({
    title: z.string().min(5).max(55),
    description: z.string().min(5).max(1024),
    date: z.coerce.date(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    venue: z.string().min(5).max(55),
    isFree: z.boolean(),
    price: z.number().min(0).optional(),
    capacity: z.number().min(0),
    category: z.enum([
      "cinema",
      "educational",
      "theater",
      "discourse",
      "weg",
      "comedy",
      "webinar",
    ]),
    coverImage: z.string().optional(),
    isPrivate: z.boolean(),
  })
  .refine(
    (data) =>
      data.isFree ? true : data.price !== undefined && data.price >= 0,
    { message: "Price is required for paid events", path: ["price"] },
  );

export const Event = model<IEventDocument>("Event", eventSchema);
export { eventPostSchema, IEvent };
