import express from "express";
import { transferTicket } from "../controllers/ticketController";
import { auth } from "../middlewares/auth";

const router = express.Router();
router.post("/:id/transfer", auth, transferTicket);

export default router;
