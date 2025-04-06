import express from "express";
import env from "dotenv";
env.config();
import mongoose, { ObjectId } from "mongoose";

import { getUserById } from "./services/userService";
import { IUser } from "./models/user";
import { registerUser, loginUser } from "./controllers/userController";
import { errorHandler } from "./controllers/errorMiddleware";

if (!process.env.jwtPrivateKey)
  throw new Error("FATAL: jwtPrivateKey not defined. ");

mongoose
  .connect("mongodb://localhost/keteroye")
  .then(() => console.log("Connected to MongoDB..."))
  .catch(() => console.log("Unable to connected to MongoDB!"));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);

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

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
