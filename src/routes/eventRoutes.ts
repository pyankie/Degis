import express from "express";
const router = express.Router();
import EventController from "../controllers/eventController";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authRole";

router.get("/:id", EventController.getEventById);

router.post(
  "/",
  auth,
  authorize(["organizer", "admin"]),
  EventController.createEvent,
);
router.put(
  "/:id",
  auth,
  authorize(["admin", "organizer"]),
  EventController.updateEvent,
);

export default router;
