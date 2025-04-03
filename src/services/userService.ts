import bcrypt from "bcryptjs";
import userModel, { IUser } from "../models/user";
import { ObjectId } from "mongoose";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DuplicateKeyError extends AppError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exits.`, 409);
    this.name = this.constructor.name;
  }
}

const { User } = userModel;

export const createUser = async (userData: IUser) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(userData.password, salt);

  const newUser = new User({
    username: userData.username,
    email: userData.email,
    password: hash,
  });

  await newUser.save();

  const { password, __v, role, ...safeUser } = newUser.toObject();
  const token = newUser.generateAuthToken();
  return { token, user: safeUser };
};

export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email: email }).select("-role -__v");
};

export const getUserById = async (id: ObjectId) => {
  return await User.findById(id).select("-role -__v");
};
