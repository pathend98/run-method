import {
  trainingSessionSchema,
  trainingSessionsResponseSchema,
  type CompleteTrainingSessionRequest,
  type CreateTrainingSessionRequest,
  type EditTrainingSessionRequest,
  type SkipTrainingSessionRequest,
  type TrainingSession,
  type TrainingSessionsQuery,
} from "@/domain/training-sessions";
import { TrainingSessionsApiError } from "./errors/training-sessions-errors";

export async function fetchTrainingSessions(
  athleteId: string,
  { from, to, status }: TrainingSessionsQuery,
): Promise<TrainingSession[]> {
  const params = new URLSearchParams();
  if (from !== undefined) params.set("from", from);
  if (to !== undefined) params.set("to", to);
  if (status !== undefined) params.set("status", status);
  const query = params.toString();
  const endpoint = `/api/v1/athletes/${encodeURIComponent(athleteId)}/training-sessions`;
  const response = await fetch(query ? `${endpoint}?${query}` : endpoint);

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
  athleteId: string,
  request: CreateTrainingSessionRequest,
): Promise<TrainingSession> {
  const response = await fetch(
    `/api/v1/athletes/${encodeURIComponent(athleteId)}/training-sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );

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

export async function deleteTrainingSession(id: string): Promise<void> {
  const response = await fetch(`/api/v1/training-sessions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Unable to delete training session";

    throw new TrainingSessionsApiError(message, response.status);
  }
}

export async function skipTrainingSession(
  id: string,
  request: SkipTrainingSessionRequest,
): Promise<TrainingSession> {
  return postTrainingSessionTransition(
    `/api/v1/training-sessions/${id}/skip`,
    request,
    "Unable to skip training session",
  );
}

export async function completeTrainingSession(
  id: string,
  request: CompleteTrainingSessionRequest,
): Promise<TrainingSession> {
  return postTrainingSessionTransition(
    `/api/v1/training-sessions/${id}/complete`,
    request,
    "Unable to complete training session",
  );
}

async function postTrainingSessionTransition(
  url: string,
  request: SkipTrainingSessionRequest | CompleteTrainingSessionRequest,
  fallbackMessage: string,
): Promise<TrainingSession> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Time-Zone": browserTimeZone(),
    },
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
        : fallbackMessage;
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

function browserTimeZone(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timeZone) return timeZone;

  throw new TrainingSessionsApiError("Unable to determine browser timezone", 0);
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
