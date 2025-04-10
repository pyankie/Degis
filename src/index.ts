import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { createEvent } from "./services/eventService";
import {
  eventType,
  zodEventSchema,
  IEvent,
  IEventDocument,
} from "./models/event";
import { AppError } from "./services/userService";
import { z, ZodError } from "zod";
import { authorize } from "./middleware/authRole";
import { auth } from "./middleware/auth";

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
  async (req, res, next) => {
    const eventData: eventType = req.body;

    try {
      const validation = zodEventSchema.safeParse(eventData);

      if (!validation.success) {
        const errMessage = validation.error.errors
          .map((err) => err.message)
          .join(", ");

        return next(new AppError(errMessage, 400));
      }

      const newEvent = await createEvent(validation.data as eventType);
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

app.use(errorHandler);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
