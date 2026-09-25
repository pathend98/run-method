import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { trainingSessionsRequestValidator } from "@/server/server";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { POST } from "./route";

const service = vi.hoisted(() => ({ findById: vi.fn(), complete: vi.fn() }));

const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  getUserService: () => ({ findBySessionKey }),
  trainingSessionsRequestValidator: { validateComplete: vi.fn() },
}));

const id = "11111111-1111-4111-8111-111111111111";
const athleteId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  findBySessionKey.mockResolvedValue({ id: athleteId });
  service.findById.mockResolvedValue({ id, athleteId });
});
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
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  actualDistanceMetres: 5000,
  actualDurationSeconds: 1500,
};

const validator = vi.mocked(trainingSessionsRequestValidator);

function request(
  body = JSON.stringify(completeRequest),
  timeZone: string | null = "Pacific/Auckland",
) {
  return new NextRequest(
    `http://localhost/api/v1/training-sessions/${id}/complete`,
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

test("completes and returns a complete training session", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  service.complete.mockResolvedValue(completedSession);

  const response = await POST(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(completedSession);
  expect(service.complete).toHaveBeenCalledWith(
    id,
    completeRequest,
    "Pacific/Auckland",
  );
});

test("passes an invalid timezone header to the service", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  service.complete.mockRejectedValue(
    new TrainingSessionsValidationError(
      "Time-Zone header must be a valid IANA timezone",
    ),
  );

  const response = await POST(request(undefined, "Not/AZone"), context());

  expect(service.complete).toHaveBeenCalledWith(
    id,
    completeRequest,
    "Not/AZone",
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Time-Zone header must be a valid IANA timezone",
  });
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
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(service.complete).not.toHaveBeenCalled();
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
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(service.complete).not.toHaveBeenCalled();
  },
);
