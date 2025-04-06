import { Request, Response, NextFunction } from "express";
import { createUser, ILogin, login } from "../services/userService";
import userModel, { IUser, registerSchema, loginSchema } from "../models/user";

import { AppError, DuplicateKeyError } from "../services/userService";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userData: IUser = req.body;

  try {
    const validation = registerSchema.strict().safeParse(userData);

    if (!validation.success) {
      const errMessage = validation.error.errors
        .map((err) => err.message)
        .join(",");

      return next(new AppError(errMessage, 400));
    }

    const result = await createUser(userData);

    res.header("x-auth-token", result.token).status(200).json({
      success: true,
      data: result.user,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new DuplicateKeyError(field));
    }
    return next(new Error(err.message));
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userData: ILogin = req.body;

  try {
    const validation = loginSchema
      .strict(
        `Unexpected keys detected. Only 'usernameOrEmail' and 'password' are allowed.`,
      )
      .safeParse(userData);
    if (!validation.success) {
      const errMessage = validation.error.errors
        .map((err) => err.message)
        .join(", ");

      return next(new AppError(errMessage, 400));
    }

    const status = await login(userData);
    if (!status?.success) {
      res.status(400).json(status);
      return;
    }

    res.header("x-auth-token", status.token).json({
      success: status.success,
      // token: status.token,
      data: status.data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Login failed. Please try agin later.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
