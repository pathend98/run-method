import {
  trainingGoalSchema,
  type CreateTrainingGoalRequest,
  type TrainingGoal,
} from "@/domain/training-goals";

export async function fetchTrainingGoals(
  athleteId: string,
): Promise<TrainingGoal[]> {
  const response = await fetch(endpoint(athleteId), { cache: "no-store" });
  await checkResponse(response, "Unable to fetch training goals");
  return trainingGoalSchema.array().parse(await response.json());
}

export async function createTrainingGoal(
  athleteId: string,
  request: CreateTrainingGoalRequest,
): Promise<TrainingGoal> {
  const response = await fetch(endpoint(athleteId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  await checkResponse(response, "Unable to create training goal");
  return trainingGoalSchema.parse(await response.json());
}

function endpoint(athleteId: string) {
  return `/api/v1/athletes/${encodeURIComponent(athleteId)}/training-goals`;
}

async function checkResponse(response: Response, fallback: string) {
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => null);
  throw new Error(
    typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
      ? body.error
      : fallback,
  );
}
