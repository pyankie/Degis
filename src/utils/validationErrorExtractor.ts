import { SafeParseReturnType } from "zod";

export const extractError = (
  parsers: SafeParseReturnType<string, string>[],
) => {
  const errors = [];
  for (const parse of parsers) {
    errors.push(parse.error?.errors.map((e) => e.message) || []);
  }
  errors.filter(Boolean);
  return errors;
};
