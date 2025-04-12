import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import { errorHandler } from "./middlewares/error";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { authorize } from "./middlewares/authRole";
import { auth } from "./middlewares/auth";
import EventController from "./controllers/eventController";

if (!process.env.jwtPrivateKey)
  throw new Error("FATAL: jwtPrivateKey not defined. ");

mongoose
  .connect("mongodb://localhost/keteroye")
  .then(() => console.log("Connected to MongoDB..."))
  .catch(() => console.log("Unable to connected to MongoDB!"));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// users
app.use("/api/auth", authRoutes);
app.use("/api/users/me", userRoutes);

//events
app.get("/api/events/:id", EventController.getEventById);
app.get("/api/my-events", auth, EventController.getCurrentOrganizerEvents);
app.post(
  "/api/events/",
  auth,
  authorize(["organizer", "admin"]),
  EventController.createEvent,
);
app.put(
  "/api/events/:id",
  auth,
  authorize(["admin", "organizer"]),
  EventController.updateEvent,
);

app.use(errorHandler);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
