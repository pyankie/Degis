import s3Client from "../utils/s3Client";
import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { File } from "../models/file";

export const upload = async (file: Express.Multer.File, userID: string) => {
  const userId = new Types.ObjectId(userID);

  const bucket = file.mimetype.startsWith("image")
    ? process.env.R2_IMAGE_BUCKET!
    : process.env.R2_KYC_BUCKET!;

  const key = `${userId}/${Date.now()}-${file.originalname}`;

  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: file.mimetype.startsWith("image") ? "public-read" : undefined,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  const fileDoc = await File.create({
    userId,
    fileUrl: `https://${bucket}.r2.cloudflarestorage.com/${key}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
    type: file.mimetype.startsWith("image") ? "image" : "kyc",
    size: file.size,
  });

  return { fileDoc, key };
};
