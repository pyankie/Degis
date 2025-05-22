import { Request, Response, NextFunction } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUserTickets,
  ILogin,
  login,
  updateUser,
} from "../services/userService";
import { IUser } from "../models/user";
import { registerSchema, loginSchema } from "../schemas/user.schemas";

import { AppError } from "../utils/errors/appError";
import { DuplicateKeyError } from "../utils/errors/duplicateKeyError";
import { AuthRequest } from "../middlewares/auth";
import { myEventsQuerySchema } from "../schemas/query.schema";
import { getEvents } from "../services/eventService";
import { EventInvitation } from "../models/eventInvitation";
import { Event } from "../models/event";
import { createFreeTicket } from "../services/ticketService";
import { getNotifications } from "../services/notificationService";

export default class UserController {
  static getMyEvents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?._id;
      const parseQuery = myEventsQuerySchema.safeParse(req.query);

      if (!parseQuery.success) {
        const errMessage = parseQuery.error.errors
          .map((err) => err.message)
          .join(", ");
        return next(new AppError(errMessage, 400));
      }

      const { tickets, totalTickets } = await getUserTickets(
        userId ?? "",
        parseQuery.data,
      );

      if (!tickets || !tickets.length) {
        res.status(404).json({ success: false, message: "No event found" });
        return;
      }

      const eventIds = tickets.map((ticket) => ticket.eventId);
      const { page: pageNumber = 1, pageSize: pageSizeNumber = 10 } =
        parseQuery.data;

      const events = await getEvents(eventIds);

      if (!events || !events.length) {
        res.status(404).json({ success: false, message: "No event found" });
        return;
      }

      res.json({
        success: true,
        totalEvents: totalTickets,
        data: events,
        pagination: {
          pageNumber,
          pageSizeNumber,
          totalPages: Math.ceil(totalTickets / pageSizeNumber),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to get events.",
      });
      next(new Error(err.message));
    }
  };
  static registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    //FIXME: use valdation.data, not req.body
    const userData: IUser = req.body;

    try {
      const validation = registerSchema.strict().safeParse(userData);

      if (!validation.success) {
        const errMessage = validation.error.errors
          .map((err) => err.message)
          .join(",");

        return next(new AppError(errMessage, 400));
      }

      const { email: insertedEmail, token: uuidToken } = validation.data;

      if (uuidToken) {
        const invitation = await EventInvitation.findOne({
          token: uuidToken,
          status: "pending",
        });

        if (!invitation) {
          res.status(400).json({ success: false, message: "Invalid token" });
          return;
        }

        const isSameEmail = invitation.email === insertedEmail;
        if (!isSameEmail) {
          res.status(400).json({
            success: false,
            message: "Different from invitation email",
          });
          return;
        }

        const { eventId, email } = invitation;

        const event = await Event.findById(eventId);

        if (!event) {
          console.log("Event not found for token:", uuidToken);
          res.status(400).json({ success: false, message: "Invalid token" });
          return;
        }

        const { user, token: jwtToken } = await createUser(userData);

        if (!user) {
          console.log("user not found for token:", uuidToken);
          res.status(400).json({ success: false, message: "Invalid token" });
          return;
        }

        console.log("user who existed: ", user);
        event.invitees?.push(user!._id);

        invitation.status = "accepted";
        invitation.expiresAt = new Date();

        Promise.all([await event.save(), await invitation.save()]).catch(
          (err) => {
            console.log("Error saving event or invitation:", err);
          },
        );

        const newTicket = await createFreeTicket({
          userId: user!._id.toString(),
          eventId: eventId.toString(),
        });

        console.log("New Ticket:", newTicket);

        res.header("x-auth-token", jwtToken).status(200).json({
          success: true,
          data: user,
        });
      } else {
        const result = await createUser(userData);

        res.header("x-auth-token", result.token).status(200).json({
          success: true,
          data: result.user,
        });
      }
    } catch (err: any) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return next(new DuplicateKeyError(field));
      }
      return next(new Error(err.message));
    }
  };

  static loginUser = async (
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

  static getCurrentUser = async (
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
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  };

  static updateUser = async (
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

  static deleteUser = async (
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

  static getMyNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user!._id;

    try {
      const notifications = await getNotifications(userId);
      if (!notifications || !notifications.length) {
        res.status(404).json({
          success: false,
          message: "No notification found",
        });
        return;
      }

      res.json({ success: true, data: notifications });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: "Failed to get notifications.",
      });
      next(new Error(err.message));
    }
  };
}
