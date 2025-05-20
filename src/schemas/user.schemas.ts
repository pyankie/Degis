import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(5, "Username must contain at least 5 characters")
  .max(55);

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email")
  .min(6, "Email must contain at least 6 characters")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(1024);

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  token: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      { message: "Invalid token" },
    )
    .optional(),
});

export const loginSchema = z.object({
  usernameOrEmail: z.union([usernameSchema, emailSchema], {
    // errorMap: () => ({ message: "Must be a valid username or email" }),
  }),
  password: passwordSchema,
});
