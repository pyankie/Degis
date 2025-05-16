import { Ticket } from "../models/ticket";
import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";

interface ITicket {
  userId: string;
  eventId: string;
  ticketType?: string;
  txRef?: string;
  amount?: number;
  paymentStatus?: string;
}

export const createFreeTicket = async (data: ITicket) => {
  const userId = new Types.ObjectId(data.userId);
  const eventId = new Types.ObjectId(data.eventId);

  const txRef = `free-${uuidv4()}`;
  return await Ticket.create({
    userId,
    eventId,
    price: 0,
    qrCode: uuidv4(),
    paymentStatus: "completed",
    transactionRef: txRef,
    originalOwnerId: userId,
  });
};
export const createPaidTicket = async (data: ITicket) => {
  const { eventId, ticketType, amount, txRef, userId } = data;
  return Ticket.create({
    eventId: new Types.ObjectId(eventId),
    userId: new Types.ObjectId(userId),
    type: ticketType,
    price: amount,
    qrCode: uuidv4(),
    transactionRef: txRef,
  });
};
