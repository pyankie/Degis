import mongoose, { Document } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";
import { z } from "zod";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  generateAuthToken: () => string;
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, maxlength: 1024 },
  role: { type: String, default: "user" },
});

const jwtPrivateKey: Secret = process.env.jwtPrivateKey as Secret;
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, role: this.role }, jwtPrivateKey);
};

const User = mongoose.model<IUser>("User", userSchema);

const zodSchema = z.object({
  username: z.string({ message: "username is required" }).min(5).max(55),
  email: z.string({ message: "Email is required" }).email().min(6).max(254),
  password: z.string({ message: "Password is required" }).min(8).max(1024),
});

export default { zodSchema, User };
