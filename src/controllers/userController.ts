import { Request, Response, NextFunction } from "express";
import { createUser } from "../services/userService";
import userModel, { IUser } from "../models/user";
import { AppError, DuplicateKeyError } from "../services/userService";
const { zodSchema } = userModel;

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userData: IUser = req.body;

  try {
    const validation = zodSchema.strict().safeParse(userData);

    if (!validation.success) {
      const errMessage = validation.error.errors
        .map((err) => err.message)
        .join(",");

      return next(new AppError(errMessage, 400));
    }

    const result = await createUser(userData);

    res.header("x-auth-token", result.token).status(201).json({
      success: true,
      data: result.user,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new DuplicateKeyError("user", field));
    }
    return next(new Error(err.message));
  }
};
