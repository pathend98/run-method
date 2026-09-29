import { z } from "zod";

export const userSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["REGISTERED", "GUEST"]),
  expiresAt: z
    .union([z.date(), z.iso.datetime().transform((value) => new Date(value))])
    .nullable(),
  firstName: z.string().trim().min(1).max(100).nullable(),
  measurementUnit: z.enum(["KILOMETRES", "MILES"]),
});

export type User = z.infer<typeof userSchema>;

export const updateUserProfileSchema = z
  .strictObject({
    firstName: z.string().trim().min(1).max(100).nullable().optional(),
    measurementUnit: z.enum(["KILOMETRES", "MILES"]).optional(),
  })
  .refine(
    (value) =>
      value.firstName !== undefined || value.measurementUnit !== undefined,
    { message: "At least one profile field is required" },
  );

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
