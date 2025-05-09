import express from "express";
import KycRequestController from "../controllers/kycRequestController";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authRole";
const router = express.Router();

router.get(
  "/kycs",
  auth,
  authorize(["admin"]),
  KycRequestController.getKycRequests,
);

export default router;
