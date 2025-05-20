import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import objectIdSchema from "../utils/objectIdValidator";
import { Event } from "../models/event";
import { createFreeTicket } from "../services/ticketService";
import { Ticket } from "../models/ticket";
import { extractError } from "../utils/validationErrorExtractor";
import { emailSchema } from "../schemas/user.schemas";
import { getUserByEmailOrUsername } from "../services/userService";

export const rsvpFreeEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const parseEventId = objectIdSchema.safeParse(req.params?.id);

  if (!parseEventId.success) {
    res.status(400).json({ success: false, message: "Invalid event id" });
    return;
  }

  const eventId = parseEventId.data;
  const userId = req.user?._id;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    if (!event.isFree) {
      res.status(400).json({ success: false, message: "Event is not free" });
      return;
    }

    if (
      event.isPrivate &&
      !event.invitees?.includes(new mongoose.Types.ObjectId(userId))
    ) {
      res.status(403).json({ success: false, message: "Not invited" });
      return;
    }

    if (event.ticketsSold >= event.capacity) {
      res.status(400).json({ success: false, message: "Event is full" });
      return;
    }

    const rsvp = await createFreeTicket({
      userId: userId ?? "",
      eventId: eventId,
    });

    if (!rsvp) {
      res.status(400).json({ success: false, message: "RSVP failed" });
      return;
    }

    await Event.findByIdAndUpdate(eventId, { $inc: { ticketsSold: 1 } });

    res
      .status(201)
      //TODO: Refine RSVPing response
      .json({ success: true, rsvp, message: "RSVPed successfully" });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Already RSVPed",
      });
      return;
    }
    return next(new Error(err.message));
  }
};

export const transferTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const parseReceipentEmail = emailSchema.safeParse(req.body.email);
  const parseTicketId = objectIdSchema.safeParse(req.params.id);

  if (!parseTicketId.success || !parseReceipentEmail.success) {
    const errors = extractError([parseTicketId, parseReceipentEmail]);
    res.status(400).json({
      success: false,
      message: errors.join("; "),
    });
    return;
  }

  const currentLoggedUserId = req.user!._id;
  const ticketId = parseTicketId.data;

  try {
    const ticket = await Ticket.findOne({
      _id: ticketId,
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    const currentTicketOwnerId = ticket?.userId.toString();

    if (currentLoggedUserId !== currentTicketOwnerId) {
      res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (ticket.status === "transferred") {
      res.status(400).json({
        success: false,
        message: "Ticket has already been transferred",
      });
      return;
    }

    const email = parseReceipentEmail.data;
    const user = await getUserByEmailOrUsername(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    ticket.userId = user._id;
    ticket.status = "transferred";
    await ticket.save();

    const { _id, userId, eventId, type } = ticket;
    const filterdTicket = { _id, userId, eventId, type };

    res.json({
      success: true,
      message: "Ticket transferred successfully",
      data: filterdTicket,
    });
  } catch (err: any) {
    return next(err);
  }
};
