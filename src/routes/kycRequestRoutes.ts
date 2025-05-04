import express from "express";
import { auth } from "../middlewares/auth";
import { multerErrorMiddleware } from "../middlewares/error";
import { creatUploadMiddleware } from "../middlewares/upload";
import {
  creatKycRequest,
  verifyKycRequest,
} from "../controllers/kycRequestController";
import { authorize } from "../middlewares/authRole";

const router = express.Router();

//TODO: consider stripping out spaces and other uneeded characters from the uploaded filename
router.post(
  "/kyc",
  auth,
  creatUploadMiddleware("kycDocument"),
  multerErrorMiddleware,
  creatKycRequest,
);
router.put("/kyc/:id", auth, authorize(["admin"]), verifyKycRequest);

export default router;
