import { Request, Response, NextFunction } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  ILogin,
  login,
  updateUser,
} from "../services/userService";
import { IUser, registerSchema, loginSchema } from "../models/user";

import { AppError, DuplicateKeyError } from "../services/userService";
import { AuthRequest } from "../middleware/auth";

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

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.user?._id as string;
    const currentUser = await getUserById(id);
    if (!currentUser) {
      res
        .status(400)
        .json({ success: false, message: "Unable to get account details." });
      return;
    }

    res.status(200).json({ success: true, data: currentUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const updateUserHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?._id as string;
  const userData: IUser = req.body;

  try {
    const updatedUser = await updateUser(id, userData);

    if (!updatedUser) {
      res
        .status(500)
        .json({ success: false, message: "Unable to update user." });
      return;
    }

    res.status(200).json({ success: true, updatedData: updatedUser });
  } catch (err: any) {
    if (err.message?.includes("duplicate key error")) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new DuplicateKeyError(field));
    }
    return next(new Error("Internal server error."));
  }
};

export const deleteUserHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const id = req.user?._id as string;
  try {
    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      res.status(404).json({ success: false, message: "user not found." });
      return;
    }

    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
