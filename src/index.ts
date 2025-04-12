import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import { v4 as uuidv4 } from "uuid";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import {
  createEvent,
  generateSlug,
  ISplitInvitees,
  splitInvtees,
} from "./services/eventService";
import {
  IEventType,
  Event,
  EventType,
  EventUpdateType,
  zodEventSchema,
  zodEventUpdateSchema,
} from "./models/event";
import { AppError } from "./services/userService";
import { authorize } from "./middleware/authRole";
import { auth, AuthRequest } from "./middleware/auth";
import { EventInvitation } from "./models/eventInvitation";
import { z } from "zod";

if (!process.env.jwtPrivateKey)
  throw new Error("FATAL: jwtPrivateKey not defined. ");

mongoose
  .connect("mongodb://localhost/keteroye")
  .then(() => console.log("Connected to MongoDB..."))
  .catch(() => console.log("Unable to connected to MongoDB!"));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users/me", userRoutes);

app.post(
  "/api/events/",
  auth,
  authorize(["organizer", "admin"]),
  async (req: AuthRequest, res, next) => {
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
  },
);

app.put(
  "/api/events/:id",
  auth,
  authorize(["admin", "organizer"]),
  async (req: AuthRequest, res, next) => {
    interface UpdateType extends EventUpdateType {
      slug?: string;
    }

    const objectIdSchema = z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "invalid object id",
      });

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

      const eventCreatorId = event._id as string;

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

        console.log(previousInvitees);
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
  },
);

app.use(errorHandler);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
