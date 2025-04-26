import express from "express";
const router = express.Router();
import EventController from "../controllers/eventController";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authRole";
import { rsvpFreeEvent } from "../controllers/ticketController";

router.get("/:id", EventController.getEventById);

router.get(
  "/:id/attendees",
  auth,
  authorize(["admin", "organizer"]),
  EventController.getAttendees,
);

router.get("/:id/tickets", auth, EventController.getEventTickets);
router.post(
  "/",
  auth,
  authorize(["organizer", "admin"]),
  EventController.createEvent,
);

router.post("/:id/rsvp", auth, rsvpFreeEvent);

router.put(
  "/:id",
  auth,
  authorize(["admin", "organizer"]),
  EventController.updateEvent,
);

export default router;
