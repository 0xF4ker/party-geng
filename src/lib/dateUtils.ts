export const normalizeDate = (
  input: string | Date | null | undefined,
): Date => {
  if (!input) return new Date();

  // If it's already a Date object, return it
  if (input instanceof Date) return input;

  // If it's a string
  if (typeof input === "string") {
    // 1. Check if it already has timezone info (Z or +00:00)
    if (input.includes("Z") || /[+-]\d{2}:?\d{2}$/.exec(input)) {
      return new Date(input);
    }

    // 2. If missing timezone (common in raw Postgres JSON), append Z to force UTC
    // This fixes the "1 hour ago" bug
    return new Date(input + "Z");
  }

  return new Date();
};
