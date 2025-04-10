import mongoose from "mongoose";
import { eventType } from "../models/event";
import { Event, IEvent, IEventDocument } from "../models/event";
import User from "../models/user";

export const createEvent = async (eventData: eventType) => {
  const { invitees, ...rest } = eventData;

  const invitedEmails = invitees?.map((invt) => invt.email);
  const registeredUsers = invitedEmails?.length
    ? await User.find({ email: { $in: invitedEmails } }).select("_id email")
    : [];

  const registeredEmails = registeredUsers?.map((u) => u.email);
  const registeredIds = registeredUsers?.map((u) => u._id);

  const unregisteredEmails =
    invitedEmails?.filter((email) => !registeredEmails.includes(email)) || [];

  const newEvent = new Event({
    ...rest,
    slug: generateSlug(rest.title),
    organizerId: new mongoose.Types.ObjectId(rest.organizerId),
    invitees: registeredIds,
  });
  return await newEvent.save();
};

const generateSlug = (
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
