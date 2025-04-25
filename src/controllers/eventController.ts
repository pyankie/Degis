import { v4 as uuidv4 } from "uuid";
import { NextFunction, Response } from "express";

import { AppError } from "../utils/errors/appError";
import { AuthRequest } from "../middlewares/auth";
import objectIdSchema from "../utils/objectIdValidator";

import {
  createEvent,
  generateSlug,
  getAttendees,
  getCurrentOrganizerEvents,
  getEventById,
  splitInvtees,
} from "../services/eventService";

import { Event } from "../models/event";

import {
  IEventType,
  EventType,
  EventUpdateType,
  zodEventSchema,
  zodEventUpdateSchema,
} from "../schemas/event.schema";

import { EventInvitation } from "../models/eventInvitation";
import { Ticket } from "../models/ticket";
import User from "../models/user";
import _ from "lodash";
import { attendeesQuerySchema } from "../schemas/querySchema";
import { z } from "zod";

interface UpdateType extends EventUpdateType {
  slug?: string;
}

export default class EventController {
  static getAttendees = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const parseEventId = objectIdSchema.safeParse(req.params.id);

    if (!parseEventId.success) {
      res.status(400).json({ success: false, message: "Invalid event id" });
      return;
    }

    const eventId = parseEventId.data;
    const loggedInUserId = req.user?._id;

    try {
      const event = await getEventById(eventId);
      if (!event) {
        res.status(404).json({ success: false, message: "Event not found" });
        return;
      }

      const organizerId = event.organizerId.toString();

      if (loggedInUserId !== organizerId) {
        res
          .status(403)
          .json({ success: false, message: "Unauthorized. Not your event" });
        return;
      }

      const parseQuery = attendeesQuerySchema.safeParse(req.query);

      type Query = z.infer<typeof attendeesQuerySchema>;

      const { attendees, totalAttendees } = await getAttendees(
        eventId,
        parseQuery.data as Query,
      );
      if (!attendees.length) {
        res.status(404).json({ success: false, message: "No attendees found" });
        return;
      }

      const attendeesIds = attendees.map((att) => att.userId);
      const users = await User.find({ _id: { $in: attendeesIds } });
      const usersMap = new Map(
        users.map((user) => [user._id.toString(), user]),
      );

      if (!users || !users.length) {
        res
          .status(404)
          .json({ success: false, message: " Failed to get attendees" });
        return;
      }

      const attendeesData = attendees.map((att) => {
        const user = usersMap.get(att.userId.toString());

        return {
          userId: att.userId,
          username: user?.username || "[Deleted user]",
          //TODO: mask emails
          email: user?.email,
          ticketType: att.type,
          ticketStatus: att.status,
          bookedAt: att.createdAt,
        };
      });

      res.json({
        success: true,
        data: {
          eventId,
          totalAttendees,
          attendees: attendeesData,
        },
      });
    } catch (err: any) {
      console.log(err);
      next(new Error(err.message));
    }
  };
  static createEvent = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const eventData: EventType = req.body;

    try {
      const validation = zodEventSchema.safeParse(eventData);

      if (!validation.success) {
        const errMessage = validation.error.errors
          .map((err) => err.message)
          .join(", ");

        return next(new AppError(errMessage, 400));
      }

      const userRole = req.user?.role;
      if (validation.data.isFree === false && userRole === "user") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const validData: IEventType = validation.data as IEventType;

      validData.organizerId = req.user?._id ?? "";

      const newEvent = await createEvent(validData);
      if (!newEvent) {
        res
          .status(400)
          .json({ success: false, message: "Unable to create an event." });
        return;
      }

      res.json({ success: true, data: newEvent });
    } catch (err: any) {
      next(new Error(err.message));
    }
  };

  static updateEvent = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const updateData: UpdateType = req.body;
    try {
      const eventIdParse = objectIdSchema.safeParse(req.params.id);
      const updateDataParse = zodEventUpdateSchema.safeParse(updateData);

      if (!updateDataParse.success || !eventIdParse.success) {
        const updateDataErr = updateDataParse.error?.errors
          .map((err) => err.message)
          .join(", ");

        const eventIdErr = eventIdParse.error?.errors
          .map((err) => err.message)
          .join(", ");
        return next(new AppError(`${updateDataErr} ${eventIdErr}`, 400));
      }

      const event = await Event.findById(eventIdParse.data);

      if (!event) {
        res.status(400).json({
          success: false,
          message: "Event doesn't exist",
        });
        return;
      }

      const eventCreatorId = event.organizerId.toString();
      if (req.user?._id !== eventCreatorId) {
        res.status(403).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (
        event.ticketsSold > 0 &&
        (updateData?.isFree || "ticketTypes" in updateData)
      ) {
        res.status(400).json({
          success: false,
          message: "Cannot update pricing after tickets sold",
        });
        return;
      }

      if ("title" in updateData)
        updateData.slug = generateSlug(updateData.title ?? "");
      if (updateData.isPrivate === false) updateData.invitees = [];

      const { invitees, ...rest } = updateData;

      const { registeredIds, unregisteredEmails } =
        await splitInvtees(invitees);

      const eventId = eventIdParse.data;
      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $set: { invitees: registeredIds, ...rest } },
        { new: true, runValidators: true },
      );

      if (unregisteredEmails.length > 0) {
        const previousInvitees = await EventInvitation.find({
          email: { $in: unregisteredEmails },
        }).select("_id email eventId");

        // console.log(previousInvitees);
        const prevEmails = previousInvitees.map((inv) => inv.email);

        const newEmails = unregisteredEmails.filter(
          (email) => !prevEmails.includes(email),
        );

        if (newEmails.length > 0) {
          const newInvitees = newEmails.map((email) => {
            return {
              eventId: eventId,
              token: uuidv4(),
              email,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            };
          });

          const newInvitation = await EventInvitation.insertMany(newInvitees);

          res.json({
            success: true,
            data: { updateEvent: updatedEvent, newInviteeList: newInvitation },
          });
        }
      }
      res.json({ success: true, data: updatedEvent });
    } catch (err: any) {
      next(new AppError(err.message));
    }
  };

  static getCurrentOrganizerEvents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const userId = req.user?._id;
    try {
      const events = await getCurrentOrganizerEvents(userId ?? "");

      if (!events || events.length === 0) {
        res.status(404).json({ success: false, message: "No event found" });
        return;
      }
      res.json({ success: true, data: events });
    } catch (err: any) {
      return next(new Error("Internal server error"));
    }
  };
  static getEventById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const eventIdParse = objectIdSchema.safeParse(req.params?.id);
      if (!eventIdParse.success) {
        const eventIdErr = eventIdParse.error?.errors
          .map((err) => err.message)
          .join(", ");
        return next(new AppError(eventIdErr, 400));
      }

      const eventId = eventIdParse.data;
      const event = await getEventById(eventId);
      if (!event) {
        res.status(404).json({ success: false, message: "Event not found" });
        return;
      }
      res.json({ success: true, data: event });
    } catch (err: any) {
      return next(new Error("Internal server error"));
    }
  };
}
