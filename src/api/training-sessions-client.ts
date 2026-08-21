import {
  trainingSessionsResponseSchema,
  type TrainingSession,
  type TrainingSessionDateRange,
} from "@/domain/training-sessions";

export class TrainingSessionsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TrainingSessionsApiError";
  }
}

export async function fetchTrainingSessions({
  from,
  to,
}: TrainingSessionDateRange): Promise<TrainingSession[]> {
  const params = new URLSearchParams({ from, to });
  const response = await fetch(
    `/api/v1/training-sessions?${params.toString()}`,
  );

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Unable to fetch training sessions";

    throw new TrainingSessionsApiError(message, response.status);
  }

  const body: unknown = await response.json();

  return trainingSessionsResponseSchema.parse(body);
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
