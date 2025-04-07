import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

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

app.use(errorHandler);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
