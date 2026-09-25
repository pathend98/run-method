import type { NextRequest } from "next/server";

import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";

export async function readRequestBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new TrainingSessionsRequestValidationError({
      body: ["Request body must be valid JSON"],
    });
  }
}
