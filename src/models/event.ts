import mongoose, { Document } from "mongoose";
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

const zodInviteeSchema = z.object({
  email: z.string().email(),
});
const ticketTypeSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  capacity: z.coerce.number().min(0),
});

export const booleanSchema = z
  .union([
    z.boolean(),
    z.string().transform((val) => {
      const truthyValues = ["true", "1", "yes"];
      const falsyValues = [
        "false",
        "0",
        "no",
        null,
        undefined,
        "null",
        "undefined",
      ];
      if (falsyValues.includes(val.toLowerCase().trim())) return false;
      else if (truthyValues.includes(val.toLowerCase().trim())) return true;
      throw new Error("Invalid boolean string.");
    }),
    z.number().transform((n) => n !== 0),
  ])
  .default(false);

const zodEventSchema = z
  .object({
    title: z.string({}).min(5).max(55),
    description: z.string().min(5).max(1024),
    date: z.coerce.date(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    venue: z.string().min(5).max(55),
    isFree: booleanSchema,
    organizerId: z.string(),
    invitees: z.array(zodInviteeSchema).optional(),
    ticketTypes: z.array(ticketTypeSchema).optional(),
    capacity: z.coerce.number().min(0),
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
    isPrivate: booleanSchema,
  })
  .superRefine((data, ctx) => {
    //  free events
    if (data.isFree) {
      const hasPaidTicket = data.ticketTypes?.some((t) => t.price > 0);
      if (hasPaidTicket) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Free events cannot have paid ticket types",
          path: ["ticketTypes"],
        });
      }
    }

    //  paid events
    if (!data.isFree) {
      const noTicketTypes = !data.ticketTypes || data.ticketTypes.length === 0;
      const hasFreeTicket = data.ticketTypes?.some((t) => t.price === 0);
      if (noTicketTypes || hasFreeTicket) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Paid events must only have ticket types with a price above 0",
          path: ["ticketTypes"],
        });
      }
    }
  })
  .refine(
    (data) => {
      return data.startDate <= data.endDate;
    },
    {
      message: "start date must be before or equal to end date",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      return (
        data.startDate.getDate <= data.date.getDate &&
        data.date.getDate <= data.endDate.getDate
      );
    },
    { message: "date must be between start and end date", path: ["date"] },
  )
  .superRefine((data, ctx) => {
    if (data.isPrivate && (!data.invitees || data.invitees.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Private events must have invitees",
        path: ["invitees"],
      });
    }

    if (!data.isPrivate && data.invitees && data.invitees.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Public events cannot have invitees",
        path: ["invitees"],
      });
    }
  })
  .refine(
    (data) =>
      data.isPrivate ? (data.invitees?.length ?? 0) <= data.capacity : true,
    {
      message: "Invitees must not exceed event capacity",
      path: ["invitees"],
    },
  );

const zodEventUpdateSchema = z
  .object({
    title: z.string().min(5).max(55).optional(),
    description: z.string().min(5).max(1024).optional(),
    date: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    venue: z.string().min(5).max(55).optional(),
    isFree: z.boolean().optional(),
    ticketTypes: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.coerce.number().min(0),
          capacity: z.coerce.number().min(0).optional(),
        }),
      )
      .optional(),
    capacity: z.coerce.number().min(0).optional(),
    coverImage: z.string().optional(),
    isPrivate: z.boolean().optional(),
    invitees: z.array(zodInviteeSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate ticketTypes if provided
    if (data.ticketTypes) {
      if (data.isFree === true && data.ticketTypes.some((t) => t.price > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Free events cannot have paid ticket types",
          path: ["ticketTypes"],
        });
      }
      if (
        data.isFree === false &&
        (!data.ticketTypes.length ||
          data.ticketTypes.some((t) => t.price === 0))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Paid events must have ticket types with prices above 0",
          path: ["ticketTypes"],
        });
      }
    }

    // Date consistency if provided
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
      });
    }

    // Private/invitees logic if provided
    if (
      data.isPrivate === true &&
      (!data.invitees || data.invitees.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Private events must have invitees",
        path: ["invitees"],
      });
    }
    if (data.isPrivate === false && (data.invitees?.length ?? 0) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Public events cannot have invitees",
        path: ["invitees"],
      });
    }
  });

type eventUpdateType = z.infer<typeof zodEventUpdateSchema>;
type eventType = z.infer<typeof zodEventSchema>;
const Event = mongoose.model<IEventDocument>("Event", eventSchema);

export {
  IEventDocument,
  IEvent,
  Event,
  zodEventSchema,
  zodEventUpdateSchema,
  eventType,
  eventUpdateType,
};
