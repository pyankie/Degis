import mongoose, { Document } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";
import { z } from "zod";

export interface IUser {
  username: string;
  email: string;
  password: string;
}

export interface IUserDocuemnt extends IUser, Document {
  role: "user";
  generateAuthToken: () => string;
}

const userSchema = new mongoose.Schema({
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
  role: { type: String, default: "user" },
});

const jwtPrivateKey: Secret = process.env.jwtPrivateKey as Secret;

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, role: this.role }, jwtPrivateKey);
};

const User = mongoose.model<IUserDocuemnt>("User", userSchema);

const zodSchema = z.object({
  username: z
    .string({ message: "username is required" })
    .min(5, { message: "username must contain at least 5 characters" })
    .max(55),
  email: z
    .string({ message: "Email is required" })
    .email()
    .min(6, { message: "email must contain at least 6 characters" })
    .max(254),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "password must contain at least 8 characters" })
    .max(1024),
});

export default { zodSchema, User };
