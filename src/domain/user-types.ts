import { z } from "zod";

export const userSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["REGISTERED", "GUEST"]),
  expiresAt: z
    .union([z.date(), z.iso.datetime().transform((value) => new Date(value))])
    .nullable(),
});

export type User = z.infer<typeof userSchema>;
