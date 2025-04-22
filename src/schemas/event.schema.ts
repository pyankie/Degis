import { z } from "zod";

const zodInviteeSchema = z.string().email();
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

    if (data.startDate > data.date || data.date > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date must be between start and end date",
        path: ["date"],
      });
    }
    if (data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
      });
    }

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

    if (data.isPrivate && (data.invitees?.length ?? 0) > data.capacity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invitees must not exceed event capacity",
        path: ["invitees"],
      });
    }
  });

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
    // validate only if ticketTypes is present
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

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
      });
    }

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

type EventUpdateType = z.infer<typeof zodEventUpdateSchema>;
type EventType = z.infer<typeof zodEventSchema>;

interface IEventType extends EventType {
  organizerId: string;
}

export {
  IEventType,
  EventType,
  zodEventSchema,
  zodEventUpdateSchema,
  EventUpdateType,
};
