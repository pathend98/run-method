import {
  trainingSessionSchema,
  trainingSessionsResponseSchema,
  type CreateTrainingSessionRequest,
  type EditTrainingSessionRequest,
  type TrainingSession,
  type TrainingSessionDateRange,
} from "@/domain/training-sessions";
import { TrainingSessionsApiError } from "./errors/training-sessions-errors";

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
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Unable to fetch training sessions";

    throw new TrainingSessionsApiError(message, response.status);
  }

  const body: unknown = await response.json();

  return trainingSessionsResponseSchema.parse(body);
}

export async function createTrainingSession(
  request: CreateTrainingSessionRequest,
): Promise<TrainingSession> {
  const response = await fetch("/api/v1/training-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Unable to create training session";
    const fieldErrors =
      typeof body === "object" &&
      body !== null &&
      "fieldErrors" in body &&
      isFieldErrors(body.fieldErrors)
        ? body.fieldErrors
        : undefined;

    throw new TrainingSessionsApiError(message, response.status, fieldErrors);
  }

  return trainingSessionSchema.parse(await response.json());
}

export async function editTrainingSession(
  id: string,
  request: EditTrainingSessionRequest,
): Promise<TrainingSession> {
  const response = await fetch(`/api/v1/training-sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Unable to edit training session";
    const fieldErrors =
      typeof body === "object" &&
      body !== null &&
      "fieldErrors" in body &&
      isFieldErrors(body.fieldErrors)
        ? body.fieldErrors
        : undefined;

    throw new TrainingSessionsApiError(message, response.status, fieldErrors);
  }

  return trainingSessionSchema.parse(await response.json());
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string"),
    )
  );
}
