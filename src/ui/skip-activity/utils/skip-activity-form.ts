import { z } from "zod";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";

export const skipActivityFormSchema = z.object({
  skipReason: z.string().trim().min(1, "Enter a skip reason"),
});

export type SkipActivityFormValues = z.infer<typeof skipActivityFormSchema>;

export function toSkipTrainingSessionRequest(
  values: SkipActivityFormValues,
): SkipTrainingSessionRequest {
  return skipActivityFormSchema.parse(values);
}
