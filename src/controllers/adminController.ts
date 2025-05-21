import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import objectIdSchema from "../utils/objectIdValidator";
import { getUserById } from "../services/userService";
import { extractError } from "../utils/validationErrorExtractor";
import { userStatusSchema } from "../schemas/userStatus.schema";

export const changeUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const parseUserStatus = userStatusSchema.strict().safeParse(req.body);
  const parseUserId = objectIdSchema.safeParse(req.params.id);

  if (!parseUserId.success || !parseUserStatus.success) {
    const errors = extractError([parseUserStatus, parseUserId]);
    res.status(400).json({
      success: false,
      message: errors.join("; "),
    });
    return;
  }

  const userId = parseUserId.data;
  try {
    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.role = parseUserStatus.data.role;
    user.isBanned = parseUserStatus.data.isBanned;

    await user.save();

    res.json({
      success: true,
      message: "User status updated successfully",
    });
  } catch (err: any) {
    return next(new Error(err.message));
  }
};
