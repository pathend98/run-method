import { z } from "zod";
import { trimmedNonEmptyStringSchema } from "./field-schemas";

export const userSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["REGISTERED", "GUEST"]),
  expiresAt: z
    .union([z.date(), z.iso.datetime().transform((value) => new Date(value))])
    .nullable(),
  firstName: trimmedNonEmptyStringSchema.max(100).nullable(),
  measurementUnit: z.enum(["KILOMETRES", "MILES"]),
});

export type User = z.infer<typeof userSchema>;

export const updateUserProfileSchema = userSchema
  .pick({ firstName: true, measurementUnit: true })
  .partial()
  .strict()
  .refine(
    (value) =>
      value.firstName !== undefined || value.measurementUnit !== undefined,
    { message: "At least one profile field is required" },
  );

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
