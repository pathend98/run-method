import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import {
  trainingSessionsRequestValidator,
  trainingSessionsService,
} from "@/server/server";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { POST } from "./route";

vi.mock("@/server/server", () => ({
  trainingSessionsService: { complete: vi.fn() },
  trainingSessionsRequestValidator: { validateComplete: vi.fn() },
}));

const id = "11111111-1111-4111-8111-111111111111";
const completeRequest = {
  actualDurationSeconds: 1500,
  actualDistanceMetres: 5000,
};
const completedSession = {
  id,
  title: "Easy run",
  activityType: "RUN" as const,
  status: "COMPLETED" as const,
  date: "2026-08-26",
  timeOfDay: "AM" as const,
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  targetType: "DISTANCE_DURATION" as const,
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: 5000,
  actualDurationSeconds: 1500,
};

const service = vi.mocked(trainingSessionsService);
const validator = vi.mocked(trainingSessionsRequestValidator);

function request(body = JSON.stringify(completeRequest)) {
  return new NextRequest(
    `http://localhost/api/v1/training-sessions/${id}/complete`,
    { method: "POST", body },
  );
}

function context(sessionId = id) {
  return { params: Promise.resolve({ id: sessionId }) };
}

test("completes and returns a complete training session", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  service.complete.mockResolvedValue(completedSession);

  const response = await POST(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(completedSession);
  expect(service.complete).toHaveBeenCalledWith(id, completeRequest);
});

test("returns malformed completion JSON with 400 status", async () => {
  const response = await POST(request("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
});

test("returns completion field errors with 400 status", async () => {
  validator.validateComplete.mockImplementation(() => {
    throw new TrainingSessionsRequestValidationError({
      actualDurationSeconds: ["Required"],
    });
  });

  const response = await POST(request(), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { actualDurationSeconds: ["Required"] },
  });
});

test.each([
  [new TrainingSessionNotFoundError(), 404, "Training session not found"],
  [
    new BadRequestError("only scheduled sessions can be completed"),
    400,
    "only scheduled sessions can be completed",
  ],
  [
    new TrainingSessionsValidationError(
      "future training sessions cannot be completed",
    ),
    400,
    "future training sessions cannot be completed",
  ],
] as const)(
  "maps expected completion errors",
  async (error, status, message) => {
    validator.validateComplete.mockReturnValue(completeRequest);
    service.complete.mockRejectedValue(error);

    const response = await POST(request(), context());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
  },
);

test("returns stable unexpected completion errors", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  service.complete.mockRejectedValue(new Error("database down"));

  const response = await POST(request(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete training session",
  });
});
