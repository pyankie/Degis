import mongoose, { Document } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";
import { z } from "zod";

export interface IUser {
  username: string;
  email: string;
  password: string;
}

export interface IUserDocuemnt extends IUser, Document {
  role: "user" | "organizer" | "admin";
  createdAt: Date;
  updatedAt: Date;
  generateAuthToken: () => string;
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      // collation: { locale: "en", strength: 1 },
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: { type: String, required: true, maxlength: 1024, select: false },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const jwtPrivateKey: Secret = process.env.jwtPrivateKey as Secret;

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      // username: this.username,
      role: this.role,
    },
    jwtPrivateKey,
  );
};

const User = mongoose.model<IUserDocuemnt>("User", userSchema);

export const usernameSchema = z
  .string()
  .min(5, "Username must contain at least 5 characters")
  .max(55);

export const emailSchema = z
  .string()
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
});

export const loginSchema = z.object({
  usernameOrEmail: z.union([usernameSchema, emailSchema], {
    // errorMap: () => ({ message: "Must be a valid username or email" }),
  }),
  password: passwordSchema,
});

export default User;
