import { z } from "zod";

export const positiveIntegerSchema = z.number().int().positive();
export const trimmedNonEmptyStringSchema = z.string().trim().min(1);
