import { z } from "zod";

// Profile update schema
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  // Client fields
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  // Vendor fields
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100).optional(),
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  about: z.string().max(5000, "About must be less than 5000 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  avatarUrl: z.union([z.string().url("Invalid image URL"), z.literal(""), z.null(), z.undefined()]).optional(),
});

// Password update schema
export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// KYC submission schema
export const kycSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  businessAddress: z.string().max(500, "Address is too long").optional(),
  meansOfId: z.string().optional(),
  idNumber: z.string().optional(),
  cacNumber: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  idCardUrl: z.string().url("Invalid document URL").optional(),
  cacDocumentUrl: z.string().url("Invalid document URL").optional(),
});
