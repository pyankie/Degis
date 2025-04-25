import express from "express";
import UserController from "../controllers/userController";
import { auth } from "../middlewares/auth";
const router = express.Router();

router.get("/events", auth, UserController.getMyEvents);
router.put("/", auth, UserController.updateUser);
router.delete("/", auth, UserController.deleteUser);

export default router;
