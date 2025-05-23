import bcrypt from "bcryptjs";
import { emailSchema } from "../schemas/user.schemas";
import User, { IUser } from "../models/user";

import { ObjectId, Types } from "mongoose";
import _ from "lodash";
import { AppError } from "../utils/errors/appError";
import { myEventsQuerySchema } from "../schemas/query.schema";
import { z } from "zod";
import { Ticket } from "../models/ticket";
import { Event } from "../models/event";

export interface ILogin {
  usernameOrEmail: string;
  password: string;
}

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

export const getUserById = async (id: string) => {
  const objectId = new Types.ObjectId(id);

  return await User.findById(objectId).select("-role -__v");
};

export const getUserByEmailOrUsername = async (
  email?: string,
  username?: string,
) => {
  const query: { [key: string]: string } = {};

  if (email) {
    query["email"] = email;
  } else if (username) {
    query["username"] = username;
  } else throw new AppError("Email or username must be provided", 401);

  return await User.findOne(query).select("+password");
};

export const login = async ({ usernameOrEmail, password }: ILogin) => {
  const isEmail = emailSchema.safeParse(usernameOrEmail).success;

  let email, username;
  isEmail ? (email = usernameOrEmail) : (username = usernameOrEmail);

  const user = await getUserByEmailOrUsername(email, username);

  if (!user) return { success: false, error: "Invalid credential" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, error: "Invalid credential" };

  const token = user.generateAuthToken();
  const filteredUser = _.omit(user.toObject(), ["password", "__v"]);

  return { success: true, token, data: filteredUser };
};

export const updateUser = async (id: string, updatedUserData: IUser) => {
  const objectId = new Types.ObjectId(id);

  const updateFields: any = {};
  const { username, password, email } = updatedUserData;

  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (password) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    updateFields.password = hash;
  }

  const updatedUser = await User.findByIdAndUpdate(
    objectId,
    { $set: updateFields },
    { new: true, runValidators: true, context: "query" },
  ).select("-__v");

  return updatedUser;
};

export const deleteUser = async (id: string) => {
  const objectId = new Types.ObjectId(id);

  return await User.findByIdAndDelete(objectId);
};

type QueryData = z.infer<typeof myEventsQuerySchema>;
export const getUserTickets = async (userId: string, queryData: QueryData) => {
  const { page: pageNumber = 1, pageSize: pageSizeNumber = 10 } = queryData;

  const skip = (pageNumber - 1) * pageSizeNumber;

  // const ticketQuery = { userId, ...(status && { status }) };

  const ticketQuery = { userId };
  const [tickets, totalTickets] = await Promise.all([
    Ticket.find(ticketQuery)
      .select("eventId")
      .skip(skip)
      .limit(pageSizeNumber)
      .lean(),
    Ticket.countDocuments(ticketQuery),
  ]);

  return { tickets, totalTickets };
};
