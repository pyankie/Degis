import { z } from "zod";

export const attendeesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().max(100).default(10),
});

export const myEventsQuerySchema = attendeesQuerySchema.extend({
  status: z.enum(["pending", "live", "completed"]).optional(),
});
