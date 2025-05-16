import mongoose from "mongoose";
import z from "zod";

export const paymentSchema = z.object({
  eventId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "invalid object id",
  }),
  ticketType: z.enum(["vip", "standard"]),
  amount: z.coerce.number().positive(),
  currency: z.enum(["ETB"]),
  phoneNumber: z.string().refine(
    (val) => {
      const phoneRegex = /^(?:\+251|0)?9\d{8}$/;
      return phoneRegex.test(val);
    },
    {
      message: "invalid phone number",
    },
  ),
});
