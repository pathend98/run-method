import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { trainingSessionsRequestValidator } from "@/server/server";
import { createUser } from "@/test-support/fixtures/user";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { POST } from "./route";

const service = vi.hoisted(() => ({ findById: vi.fn(), skip: vi.fn() }));

const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  getUserService: () => ({ findBySessionKey }),
  trainingSessionsRequestValidator: { validateSkip: vi.fn() },
}));

const id = "11111111-1111-4111-8111-111111111111";
const athleteId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  findBySessionKey.mockResolvedValue(createUser({ id: athleteId }));
  service.findById.mockResolvedValue({ id, athleteId });
});
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
      headers: {
        cookie: "__Host-user-session=session-key",
        ...(timeZone ? { "Time-Zone": timeZone } : {}),
      },
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

test.each([
  ["missing cookie", 401, "missing"],
  ["invalid cookie", 401, "invalid"],
  ["other athlete", 403, "foreign"],
  ["missing session", 404, "absent"],
])(
  "POST denies %s before body validation or mutation",
  async (_label, status, kind) => {
    const postRequest = request("{");
    if (kind === "missing") postRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    if (kind === "foreign")
      service.findById.mockResolvedValue({ id, athleteId: "other-id" });
    if (kind === "absent")
      service.findById.mockRejectedValue(new TrainingSessionNotFoundError());

    const response = await POST(postRequest, context());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(service.skip).not.toHaveBeenCalled();
  },
);

test.each([
  ["actor lookup failure", 500, "actor"],
  ["invalid id", 400, "invalid"],
  ["session lookup failure", 500, "lookup"],
])(
  "POST maps %s before body validation or mutation",
  async (_label, status, kind) => {
    if (kind === "actor")
      findBySessionKey.mockRejectedValue(new Error("database down"));
    if (kind === "invalid")
      service.findById.mockRejectedValue(
        new TrainingSessionsValidationError(
          "training session id must be a valid UUID",
        ),
      );
    if (kind === "lookup")
      service.findById.mockRejectedValue(new Error("database down"));

    const response = await POST(request("{"), context());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(service.skip).not.toHaveBeenCalled();
  },
);
