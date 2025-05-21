import mongoose, { Document } from "mongoose";
import jwt, { Secret } from "jsonwebtoken";

export interface IUser {
  username: string;
  email: string;
  password: string;
  token?: string;
}

export interface IUserDocuemnt extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  role: "user" | "organizer" | "admin";
  isBanned: Boolean;
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
    isBanned: { type: Boolean, default: false },
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
export default User;
