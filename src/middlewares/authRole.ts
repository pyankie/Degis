import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth";
import { EventType } from "../schemas/event.schema";

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventData: EventType = req.body;

    const userRole = req.user?.role as string;

    const isPaidEvent = eventData.ticketTypes?.some(
      (ticket) => typeof ticket.price === "number" && ticket.price > 0,
    );

    if (!isPaidEvent) {
      next();
      return;
    }

    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    res
      .status(403)
      .json({ success: false, message: "Unauthorized to create paid events" });
  };
};
