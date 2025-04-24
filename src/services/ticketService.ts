import { Ticket } from "../models/ticket";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";

interface ITicket {
  userId: string;
  eventId: string;
}

export const createFreeTicket = async (data: ITicket) => {
  const userId = new Types.ObjectId(data.userId);
  const eventId = new Types.ObjectId(data.eventId);

  return await Ticket.create({
    userId,
    eventId,
    price: 0,
    qrCode: uuid(),
    originalOwnerId: userId,
  });
};
