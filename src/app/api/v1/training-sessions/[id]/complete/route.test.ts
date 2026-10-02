import type * as ServerModule from "@/server/server";
import { createRunActivity } from "@/test-support/fixtures/activity";
import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { POST } from "./route";

const repository = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteById: vi.fn(),
  skip: vi.fn(),
  complete: vi.fn(),
  edit: vi.fn(),
}));

const validator = vi.hoisted(() => ({
  validateCreate: vi.fn(),
  validateEdit: vi.fn(),
  validateSkip: vi.fn(),
  validateComplete: vi.fn(),
}));

const domainValidator = vi.hoisted(() => ({
  validateEdit: vi.fn(),
  validateSkip: vi.fn(),
  validateComplete: vi.fn(),
}));
const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", async (importOriginal) => {
  const actual = await importOriginal<typeof ServerModule>();
  const { DefaultRequestAuthenticationService } =
    await import("@/server/http/request-authentication-service");
  const { DefaultTrainingSessionsService } =
    await import("@/server/training-sessions/training-sessions-service");
  return {
    ...actual,
    requestAuthenticationService: new DefaultRequestAuthenticationService(
      () => ({ findBySessionKey }),
    ),
    getTrainingSessionsService: () =>
      new DefaultTrainingSessionsService(
        repository,
        domainValidator,
        {
          findById: vi.fn(),
        },
        validator,
      ),

    getUserService: () => ({ findBySessionKey }),
  };
});

const id = "11111111-1111-4111-8111-111111111111";
const athleteId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.resetAllMocks();
  findBySessionKey.mockResolvedValue(createUser({ id: athleteId }));
  repository.findById.mockResolvedValue(createRunActivity({ id, athleteId }));
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
  repository.complete.mockResolvedValue(completedSession);

  const response = await POST(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(completedSession);
  expect(repository.complete).toHaveBeenCalledWith(
    expect.objectContaining({ id, athleteId }),
    completeRequest,
  );
  expect(domainValidator.validateComplete).toHaveBeenCalledWith(
    expect.objectContaining({ id, athleteId }),
    completeRequest,
    "Pacific/Auckland",
  );
});

test("validates an invalid timezone header before writing", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  domainValidator.validateComplete.mockImplementation(() => {
    throw new TrainingSessionsValidationError(
      "Time-Zone header must be a valid IANA timezone",
    );
  });

  const response = await POST(request(undefined, "Not/AZone"), context());

  expect(domainValidator.validateComplete).toHaveBeenCalledWith(
    expect.objectContaining({ id, athleteId }),
    completeRequest,
    "Not/AZone",
  );
  expect(repository.complete).not.toHaveBeenCalled();
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
    repository.complete.mockRejectedValue(error);

    const response = await POST(request(), context());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
  },
);

test("returns stable unexpected completion errors", async () => {
  validator.validateComplete.mockReturnValue(completeRequest);
  repository.complete.mockRejectedValue(new Error("database down"));

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
    const postRequest = request("{}");
    if (kind === "missing") postRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    if (kind === "foreign")
      repository.findById.mockResolvedValue(
        createRunActivity({ id, athleteId: "other-id" }),
      );
    if (kind === "absent") repository.findById.mockResolvedValue(null);

    const response = await POST(postRequest, context());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
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
      repository.findById.mockRejectedValue(
        new TrainingSessionsValidationError(
          "training session id must be a valid UUID",
        ),
      );
    if (kind === "lookup")
      repository.findById.mockRejectedValue(new Error("database down"));

    const response = await POST(request("{}"), context());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
  },
);

test.each(["foreign", "absent", "lookup failure"])(
  "malformed JSON takes precedence over %s session lookup",
  async (kind) => {
    if (kind === "foreign")
      repository.findById.mockResolvedValue(
        createRunActivity({ athleteId: "other-id" }),
      );
    if (kind === "absent") repository.findById.mockResolvedValue(null);
    if (kind === "lookup failure")
      repository.findById.mockRejectedValue(new Error("database down"));
    const response = await POST(request("{"), context());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
      fieldErrors: { body: ["Request body must be valid JSON"] },
    });
    expect(repository.findById).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
  },
);

test.each(["missing", "invalid"])(
  "malformed JSON still rejects %s authentication first",
  async (kind) => {
    const malformedRequest = request("{");
    if (kind === "missing")
      malformedRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    const response = await POST(malformedRequest, context());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(repository.findById).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
  },
);
