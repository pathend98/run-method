import { z } from "zod";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";

export const skipTrainingSessionFormSchema = z.object({
  skipReason: z.string().trim().min(1, "Enter a skip reason"),
});

export type SkipTrainingSessionFormValues = z.infer<
  typeof skipTrainingSessionFormSchema
>;

export function toSkipTrainingSessionRequest(
  values: SkipTrainingSessionFormValues,
): SkipTrainingSessionRequest {
  return skipTrainingSessionFormSchema.parse(values);
}
