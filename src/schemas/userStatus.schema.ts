import { z } from "zod";
export const userStatusSchema = z.object({
  role: z.enum(["user", "organizer"], { invalid_type_error: "Invalid role" }),
  isBanned: z.coerce.boolean(),
});
