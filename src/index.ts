import express from "express";
import env from "dotenv";
import mongoose from "mongoose";
env.config();

import { errorHandler } from "./middlewares/error";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import myEventRoutes from "./routes/myEventRoutes";
import uploadRoutes from "./routes/fileUploadRoutes";
import kycRequestRoutes from "./routes/kycRequestRoutes";
import adminRoutes from "./routes/adminRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import webhookRoutes from "./routes/webhookRoutes";

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
app.use("/api/me/", userRoutes);

//events
app.use("/api/events", eventRoutes);
app.use("/api/my-events", myEventRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/organizers", kycRequestRoutes);

//admin
app.use("/api/admin/", adminRoutes);

//payment
app.use("/api/payments", paymentRoutes);

//webhook
app.use("/api/payments", webhookRoutes);

app.use(errorHandler);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
