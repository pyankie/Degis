import { z } from "zod";

export const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().max(100).default(10),
  status: z.enum(["active", "used", "transferred"]).optional(),
});
