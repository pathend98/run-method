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
  trainingSessionsService: { skip: vi.fn() },
  trainingSessionsRequestValidator: { validateSkip: vi.fn() },
}));

const id = "11111111-1111-4111-8111-111111111111";
const skipRequest = { skipReason: "Recovery" };
const skippedSession = {
  id,
  title: "Easy run",
  activityType: "RUN" as const,
  status: "SKIPPED" as const,
  date: "2026-08-26",
  timeOfDay: "AM" as const,
  description: null,
  sortOrder: 0,
  skipReason: "Recovery",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const service = vi.mocked(trainingSessionsService);
const validator = vi.mocked(trainingSessionsRequestValidator);

function request(
  body = JSON.stringify(skipRequest),
  timeZone: string | null = "Pacific/Auckland",
) {
  return new NextRequest(
    `http://localhost/api/v1/training-sessions/${id}/skip`,
    {
      method: "POST",
      body,
      headers: timeZone ? { "Time-Zone": timeZone } : undefined,
    },
  );
}

function context(sessionId = id) {
  return { params: Promise.resolve({ id: sessionId }) };
}

test("skips and returns a complete training session", async () => {
  validator.validateSkip.mockReturnValue(skipRequest);
  service.skip.mockResolvedValue(skippedSession);

  const response = await POST(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(skippedSession);
  expect(service.skip).toHaveBeenCalledWith(
    id,
    skipRequest,
    "Pacific/Auckland",
  );
});

test("passes a missing timezone header to the service", async () => {
  validator.validateSkip.mockReturnValue(skipRequest);
  service.skip.mockRejectedValue(
    new TrainingSessionsValidationError("Time-Zone header is required"),
  );

  const response = await POST(request(undefined, null), context());

  expect(service.skip).toHaveBeenCalledWith(id, skipRequest, null);
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Time-Zone header is required",
  });
});

test("returns malformed skip JSON with 400 status", async () => {
  const response = await POST(request("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
});

test("returns skip field errors with 400 status", async () => {
  validator.validateSkip.mockImplementation(() => {
    throw new TrainingSessionsRequestValidationError({
      skipReason: ["Required"],
    });
  });

  const response = await POST(request(), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { skipReason: ["Required"] },
  });
});

test.each([
  [new TrainingSessionNotFoundError(), 404, "Training session not found"],
  [
    new BadRequestError("only scheduled sessions can be skipped"),
    400,
    "only scheduled sessions can be skipped",
  ],
  [
    new TrainingSessionsValidationError(
      "future training sessions cannot be skipped",
    ),
    400,
    "future training sessions cannot be skipped",
  ],
] as const)("maps expected skip errors", async (error, status, message) => {
  validator.validateSkip.mockReturnValue(skipRequest);
  service.skip.mockRejectedValue(error);

  const response = await POST(request(), context());

  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual({ error: message });
});

test("returns stable unexpected skip errors", async () => {
  validator.validateSkip.mockReturnValue(skipRequest);
  service.skip.mockRejectedValue(new Error("database down"));

  const response = await POST(request(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to skip training session",
  });
});
