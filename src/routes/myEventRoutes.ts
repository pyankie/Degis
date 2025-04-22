import express from "express";
const router = express.Router();

import EventController from "../controllers/eventController";
import { auth } from "../middlewares/auth";

router.get("/", auth, EventController.getCurrentOrganizerEvents);

export default router;
