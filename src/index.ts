import express from "express";
import env from "dotenv";
env.config();
import mongoose from "mongoose";

import { getUserById } from "./services/userService";
import { IUser } from "./models/user";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserHandler,
  deleteUserHandler,
} from "./controllers/userController";
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

interface IId extends IUser {
  id: string;
}

app.get("/", async (req, res, next) => {
  const body: IId = req.body;
  console.log(req.body);
  try {
    const newUser = await getUserById(body.id);

    res.send(newUser);
  } catch (err: any) {
    return next(new Error(err.message));
  }
});

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);
app.get("/api/auth/me", auth, getCurrentUser);
app.put("/api/users/me", auth, updateUserHandler);
app.delete("/api/users/me", auth, deleteUserHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
