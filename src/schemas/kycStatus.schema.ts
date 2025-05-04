import z from "zod";

export const kycRequestStatusSchema = z
  .object({
    status: z.enum(["verified", "rejected"]),
    reason: z.string().optional(),
  })
  .refine(
    (val) =>
      val.status === "verified" || (val.status === "rejected" && val.reason),
    {
      message: "Reason required for rejected requests",
      path: ["reason"],
    },
  );
