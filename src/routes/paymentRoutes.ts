import express from "express";
import { PaymentController } from "../controllers/paymentController";
const router = express.Router();

router.post("/initiate", PaymentController.initiatePayment);

export default router;
