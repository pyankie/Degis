import express from "express";
import { PaymentController } from "../controllers/paymentController";
const router = express.Router();

router.post("/webhook", PaymentController.handleChapaWebhook);

export default router;
