import { eventType } from "../models/event";
import { Event, IEvent, IEventDocument } from "../models/event";

export const createEvent = async (eventData: eventType) => {
  const newEvent = new Event({
    ...eventData,
    slug: generateSlug(eventData.title),
    // invitees: eventData.invitees
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
