import mongoose, { Types } from "mongoose";
import { IEventType } from "../schemas/event.schema";
import { Event } from "../models/event";
import User from "../models/user";
import { EventInvitation } from "../models/eventInvitation";
import { v4 as uuidv4 } from "uuid";

export interface ISplitInvitees {
  registeredIds: mongoose.Types.ObjectId[];
  unregisteredEmails: string[];
}

export const getCurrentOrganizerEvents = async (organizerId: string) => {
  const id = new mongoose.Types.ObjectId(organizerId);
  return await Event.find({ organizerId: id });
};

export const getEvents = async (
  eventIds: Types.ObjectId[],
  status?: string,
) => {
  return await Event.find({
    _id: { $in: eventIds },
    ...(status && { status }),
  })
    .select({
      title: 1,
      venue: 1,
      startDate: 1,
      date: 1,
      endDate: 1,
      category: 1,
    })
    .lean();
};

export const getEventById = async (eventId: string) => {
  const id = new mongoose.Types.ObjectId(eventId);
  return await Event.findById(id);
};

export const createEvent = async (eventData: IEventType) => {
  //TODO: check if the user is an organizer
  //TODO: add email sending logic upon event creation to invitees (both registered and unregistered users)

  const { invitees, ...rest } = eventData;
  const { registeredIds, unregisteredEmails } = await splitInvtees(invitees);

  const newEvent = new Event({
    ...rest,
    slug: generateSlug(rest.title),
    organizerId: new mongoose.Types.ObjectId(rest.organizerId),
    invitees: registeredIds,
  });

  const savedEvent = await newEvent.save();

  if (unregisteredEmails.length > 0) {
    const unregisteredInvitees = unregisteredEmails.map((email) => {
      return {
        eventId: newEvent._id,
        token: uuidv4(),
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    });

    await EventInvitation.insertMany(unregisteredInvitees);
  }
  return savedEvent;
};

export const splitInvtees = async (
  invitees?: string[],
): Promise<ISplitInvitees> => {
  const invitedEmails = invitees;

  const registeredUsers = invitedEmails?.length
    ? await User.find({ email: { $in: invitedEmails } }).select("_id email ")
    : [];

  const registeredEmails = registeredUsers?.map((u) => u.email);

  const registeredIds = registeredUsers?.map(
    (u) => u._id,
  ) as mongoose.Types.ObjectId[];

  const unregisteredEmails =
    invitedEmails?.filter((email) => !registeredEmails.includes(email)) || [];

  return {
    registeredIds,
    unregisteredEmails,
  };
};
export const generateSlug = (
  title: string,
  uniqueIdentifier?: string | number,
): string => {
  return (
    title
      .toLowerCase()

      //diacritics/accents
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

      //  spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")

      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, "")

      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, "-")

      // Trim hyphens from start and end
      .replace(/^-+|-+$/g, "") +
    // Append unique identifier (timestamp if none provided)
    (uniqueIdentifier ? `-${uniqueIdentifier}` : `-${Date.now()}`)
  );
};
