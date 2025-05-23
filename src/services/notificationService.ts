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
  //TODO: add pagination page and limit
  //TODO: add query params: ?status=all, unread: default
  return await Notification.find({ userId, status: "unread" })
    .select("-__v")
    .sort({ createdAt: -1 })
    .populate("eventId", "title", "Event");
};
