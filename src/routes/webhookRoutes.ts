import express from "express";
import { PaymentController } from "../controllers/paymentController";
const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleChapaWebhook,
);

export default router;
