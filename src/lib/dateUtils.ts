export const normalizeDate = (
  input: string | Date | null | undefined,
): Date => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === "string") {
    if (input.includes("Z") || /[+-]\d{2}:?\d{2}$/.exec(input)) {
      return new Date(input);
    }
    return new Date(input + "Z");
  }
  return new Date();
};
