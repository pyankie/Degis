import { Types } from "mongoose";
import { INotification, Notification } from "../models/notification";

export const createNotification = async (data: INotification) => {
  const { userId, eventId, ...rest } = data;

  return await Notification.create({
    userId: new Types.ObjectId(userId),
    eventId: new Types.ObjectId(eventId),
    ...rest,
  });
};

export const getNotifications = async (userId: string) => {
  return await Notification.find({ userId })
    .populate("eventId")
    .sort({ createdAt: -1 });
};
