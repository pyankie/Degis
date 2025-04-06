import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import UserController from "./controllers/userController";
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

app.post("/api/auth/register", UserController.registerUser);
app.post("/api/auth/login", UserController.loginUser);
app.get("/api/auth/me", auth, UserController.getCurrentUser);
app.put("/api/users/me", auth, UserController.updateUser);
app.delete("/api/users/me", auth, UserController.deleteUser);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
