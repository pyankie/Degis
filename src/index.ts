import express from "express";
import env from "dotenv";
env.config();
import mongoose, { ObjectId, Types } from "mongoose";

import {
  DuplicateKeyError,
  getUserById,
  updateUser,
} from "./services/userService";
import { IUser } from "./models/user";
import { registerUser, loginUser } from "./controllers/userController";
import { auth, AuthRequest } from "./middleware/auth";

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
  id: ObjectId;
}

app.get("/", async (req, res) => {
  const body: IId = req.body;
  console.log(req.body);
  try {
    const newUser = await getUserById(body.id);

    res.send(newUser);
  } catch (err: any) {
    res.send(err.message);
  }
});

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);

app.put("/api/user/me", auth, async (req: AuthRequest, res, next) => {
  const id = req.user?._id as string;
  const userData: IUser = req.body;

  try {
    const updatedUser = await updateUser(id, userData);

    if (!updatedUser) {
      res
        .status(500)
        .json({ success: false, message: "unable to update user" });
      return;
    }

    res.status(201).json({ success: true, updatedData: updatedUser });
  } catch (err: any) {
    if (err.message?.includes("duplicate key error")) {
      const field = Object.keys(err.keyPattern)[0];
      return next(new DuplicateKeyError(field));
    }
    return next(new Error("Internal server error"));
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
