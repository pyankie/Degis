import express from "express";
import UserController from "../controllers/userController";
import { auth } from "../middleware/auth";
const router = express.Router();

router.put("/", auth, UserController.updateUser);
router.delete("/", auth, UserController.deleteUser);

export default router;
