import express from "express";
import { PaymentController } from "../controllers/paymentController";
import { auth } from "../middlewares/auth";
const router = express.Router();

router.post("/initiate", auth, PaymentController.initiatePayment);

export default router;
