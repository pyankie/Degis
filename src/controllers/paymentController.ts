import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { paymentSchema } from "../schemas/payment.schema";
import { v4 as uuidv4 } from "uuid";
import { getEventById } from "../services/eventService";
import axios from "axios";
import { createPaidTicket } from "../services/ticketService";
import { Ticket } from "../models/ticket";
import crypto from "crypto";

export class PaymentController {
  static initiatePayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsePayment = paymentSchema.safeParse(req.body);
      if (!parsePayment.success) {
        res.status(400).json({
          success: false,
          message: parsePayment.error.errors[0].message,
        });
        return;
      }

      const { eventId, ticketType, amount, phoneNumber, currency } =
        parsePayment.data;

      //TODO: add the provided phoneNumber to the Users collection
      const event = await getEventById(eventId);
      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        });
        return;
      }
      if (event.isFree) {
        res.status(400).json({
          success: false,
          message: "This event is free",
        });
        return;
      }

      const ticket = event.ticketTypes?.find(
        (t) => t.name === ticketType && t.price === amount,
      );
      if (!ticket || (ticket.capacity ?? 0) <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid ticket type or sold out",
        });
        return;
      }

      const txRef = uuidv4();

      //TODO: consider adding other payment methods besides telebirr
      const response = await axios.post(
        "https://api.chapa.co/v1/charges?type=telebirr",
        {
          tx_ref: txRef,
          amount,
          currency,
          email: req.user?.email,
          mobile: phoneNumber,
          //TODO: add return_url for frontend access
          callback_url: `${process.env.CHAPA_CALLBACK_URL}/api/payments/webhook`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
          },
        },
      );

      const userId = req.user!.id;
      await createPaidTicket({
        eventId,
        userId,
        ticketType,
        amount,
        txRef,
      });

      const success = response.data.status === "success" ? true : false;
      const message = success ? "Payment initiated" : "Payment failed";
      res.json({
        success,
        message,
      });
    } catch (err: any) {
      next(new Error(err.message));
    }
  };

  static handleChapaWebhook = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      //TODO: consider checking the signature of the webhook
      const { status, tx_ref } = req.body;

      if (!tx_ref || status !== "success") {
        res.status(400).json({
          success: false,
          message: "Invalid webhook data",
        });
        return;
      }

      const response = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
          },
        },
      );

      // const chapaSignature = response.headers.get("x-chapa-signature");

      const chapaSignature = req.headers["x-chapa-signature"];
      const secret = process.env.CHAPA_WEBHOOK_SECRET_KEY!;
      const computedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (!chapaSignature) {
        res.status(401).json({ message: "Missing signature" });
        return;
      }

      if (computedSignature !== chapaSignature) {
        res.status(401).json({ message: "Invalid signature" });
        return;
      }

      if (response.data.status === "success") {
        await Ticket.updateOne(
          //TODO: consider indexing transactionRef
          { transactionRef: tx_ref },
          { paymentStatus: "completed" },
        );
      } else {
        await Ticket.updateOne(
          { transactionRef: tx_ref },
          { paymentStatus: "failed" },
        );
      }

      const success = response.data.status === "success" ? true : false;
      const message =
        response.data.status === "success"
          ? "Payment successful"
          : "Payment failed";

      res.status(200).json({
        success,
        message,
      });
    } catch (err: any) {
      next(new Error(err.message));
    }
  };
}
