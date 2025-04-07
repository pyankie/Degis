import express from "express";
import UserController from "../controllers/userController";
import { auth } from "../middleware/auth";
const router = express.Router();

router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.get("/me", auth, UserController.getCurrentUser);

export default router;
