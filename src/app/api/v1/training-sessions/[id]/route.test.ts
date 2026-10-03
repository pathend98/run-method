import type * as ServerModule from "@/server/server";
import { createRunActivity } from "@/test-support/fixtures/activity";
import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { DELETE, PATCH } from "./route";

const repository = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteById: vi.fn(),
  skip: vi.fn(),
  complete: vi.fn(),
  edit: vi.fn(),
}));

const serviceCalls = vi.hoisted(() => vi.fn());

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
    getTrainingSessionsService: () => {
      serviceCalls();
      return new DefaultTrainingSessionsService(repository, domainValidator, {
        findById: vi.fn(),
      });
    },

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
const editRequest = {
  title: "Long easy run",
  date: "2026-08-27",
  description: "Keep it relaxed",
  timeOfDay: "PM" as const,
  activityType: "RUN" as const,
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
};
const editedSession = {
  ...editRequest,
  id,
  status: "SCHEDULED" as const,
  date: editRequest.date,
  sortOrder: 2,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-31T10:00:00.000Z",
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

function patchRequest(body: string = JSON.stringify(editRequest)) {
  return new NextRequest(`http://localhost/api/v1/training-sessions/${id}`, {
    method: "PATCH",
    body,
    headers: { cookie: "__Host-user-session=session-key" },
  });
}

function context(sessionId = id) {
  return { params: Promise.resolve({ id: sessionId }) };
}

function deleteRequest(sessionId = id) {
  return new NextRequest(
    `http://localhost/api/v1/training-sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: { cookie: "__Host-user-session=session-key" },
    },
  );
}

test("deletes a training session with 204 status", async () => {
  repository.deleteById.mockResolvedValue(true);

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(204);
  await expect(response.text()).resolves.toBe("");
  expect(repository.deleteById).toHaveBeenCalledWith(id);
});

test("returns a stable 500 response when DELETE identifier lookup fails", async () => {
  repository.findById.mockRejectedValue(new Error("Database unavailable"));
  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to delete training session",
  });
  expect(repository.findById).toHaveBeenCalledExactlyOnceWith(id);
  expect(repository.deleteById).not.toHaveBeenCalled();
});

test("returns missing delete targets with 404 status", async () => {
  repository.deleteById.mockRejectedValue(new TrainingSessionNotFoundError());

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training session not found",
  });
});

test("returns stable deletion errors with 500 status", async () => {
  repository.deleteById.mockRejectedValue(new Error("database down"));

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to delete training session",
  });
});

test("edits and returns a complete training session", async () => {
  repository.edit.mockResolvedValue(editedSession);

  const response = await PATCH(
    patchRequest(
      JSON.stringify({
        ...editRequest,
        title: `  ${editRequest.title}  `,
        description: `  ${editRequest.description}  `,
      }),
    ),
    context(),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(editedSession);
  expect(repository.edit).toHaveBeenCalledWith(
    expect.objectContaining({ id, athleteId }),
    editRequest,
  );
});

test("returns malformed JSON errors with 400 status", async () => {
  const response = await PATCH(patchRequest("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
});

test("returns edit field errors with 400 status", async () => {
  const response = await PATCH(
    patchRequest(JSON.stringify({ ...editRequest, title: "" })),
    context(),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid request body",
    fieldErrors: { title: [expect.any(String)] },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.edit).not.toHaveBeenCalled();
});

test("returns business validation errors with 400 status", async () => {
  repository.edit.mockRejectedValue(
    new BadRequestError("activityType cannot be changed"),
  );

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "activityType cannot be changed",
  });
});

test("returns a stable 500 response when PATCH identifier lookup fails", async () => {
  repository.findById.mockRejectedValue(new Error("Database unavailable"));
  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to edit training session",
  });
  expect(repository.findById).toHaveBeenCalledExactlyOnceWith(id);

  expect(repository.edit).not.toHaveBeenCalled();
});

test("returns missing sessions with 404 status", async () => {
  repository.edit.mockRejectedValue(new TrainingSessionNotFoundError());

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training session not found",
  });
});

test("returns stable edit errors with 500 status", async () => {
  repository.edit.mockRejectedValue(new Error("database down"));

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to edit training session",
  });
});

test.each([
  ["missing cookie", 401, "missing"],
  ["invalid cookie", 401, "invalid"],
  ["other athlete", 403, "foreign"],
  ["missing session", 404, "absent"],
])("DELETE denies %s before mutation", async (_label, status, kind) => {
  const request = deleteRequest();
  if (kind === "missing") request.cookies.delete("__Host-user-session");
  if (kind === "invalid")
    findBySessionKey.mockRejectedValue(new UserNotFoundError());
  if (kind === "foreign")
    repository.findById.mockResolvedValue(
      createRunActivity({ id, athleteId: "other-id" }),
    );
  if (kind === "absent") repository.findById.mockResolvedValue(null);

  const response = await DELETE(request, context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(repository.deleteById).not.toHaveBeenCalled();
});

test.each([
  ["missing cookie", 401, "missing"],
  ["invalid cookie", 401, "invalid"],
  ["other athlete", 403, "foreign"],
  ["missing session", 404, "absent"],
])("PATCH denies %s before mutation", async (_label, status, kind) => {
  const request = patchRequest();
  if (kind === "missing") request.cookies.delete("__Host-user-session");
  if (kind === "invalid")
    findBySessionKey.mockRejectedValue(new UserNotFoundError());
  if (kind === "foreign")
    repository.findById.mockResolvedValue(
      createRunActivity({ id, athleteId: "other-id" }),
    );
  if (kind === "absent") repository.findById.mockResolvedValue(null);

  const response = await PATCH(request, context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");

  expect(repository.edit).not.toHaveBeenCalled();
});

test.each([
  ["actor lookup failure", 500, "actor"],
  ["invalid id", 400, "invalid"],
  ["session lookup failure", 500, "lookup"],
])("DELETE maps %s before mutation", async (_label, status, kind) => {
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

  const response = await DELETE(deleteRequest(), context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(repository.deleteById).not.toHaveBeenCalled();
});

test.each([
  ["actor lookup failure", 500, "actor"],
  ["invalid id", 400, "invalid"],
  ["session lookup failure", 500, "lookup"],
])("PATCH maps %s before mutation", async (_label, status, kind) => {
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

  const response = await PATCH(patchRequest(), context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");

  expect(repository.edit).not.toHaveBeenCalled();
});

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
    const response = await PATCH(patchRequest("{"), context());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
      fieldErrors: { body: ["Request body must be valid JSON"] },
    });
    expect(repository.findById).not.toHaveBeenCalled();
    expect(serviceCalls).not.toHaveBeenCalled();

    expect(repository.edit).not.toHaveBeenCalled();
  },
);

test.each(["missing", "invalid"])(
  "malformed JSON still rejects %s authentication first",
  async (kind) => {
    const malformedRequest = patchRequest("{");
    if (kind === "missing")
      malformedRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    const response = await PATCH(malformedRequest, context());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(repository.findById).not.toHaveBeenCalled();
    expect(serviceCalls).not.toHaveBeenCalled();

    expect(repository.edit).not.toHaveBeenCalled();
  },
);

test.each(["foreign", "absent", "lookup failure"])(
  "schema errors take precedence over %s",
  async (kind) => {
    if (kind === "foreign")
      repository.findById.mockResolvedValue(
        createRunActivity({ athleteId: "other-id" }),
      );
    if (kind === "absent") repository.findById.mockResolvedValue(null);
    if (kind === "lookup failure")
      repository.findById.mockRejectedValue(new Error("database down"));
    const response = await PATCH(patchRequest("{}"), context());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request body",
      fieldErrors: expect.any(Object),
    });
    expect(serviceCalls).not.toHaveBeenCalled();
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
  },
);

test("rejects unexpected keys before invoking the service", async () => {
  const response = await PATCH(
    patchRequest(JSON.stringify({ ...editRequest, extra: true })),
    context(),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid request body",
    fieldErrors: {
      extra: expect.arrayContaining(['Unrecognized key: "extra"']),
    },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.edit).not.toHaveBeenCalled();
});

test.each(["missing", "invalid"])(
  "schema-invalid bodies still reject %s authentication first",
  async (kind) => {
    const invalidRequest = patchRequest("{}");
    if (kind === "missing")
      invalidRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    const response = await PATCH(invalidRequest, context());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(serviceCalls).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
  },
);

test.each([DELETE, PATCH])(
  "validates UUID before reading a body or invoking services",
  async (handler) => {
    const response = await handler(patchRequest("{"), context("invalid"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).fieldErrors.id).toEqual(expect.any(Array));
    expect(serviceCalls).not.toHaveBeenCalled();
  },
);

test.each([DELETE, PATCH])(
  "authenticates before validating UUID",
  async (handler) => {
    const response = await handler(
      new NextRequest("http://localhost/api/v1/training-sessions/invalid"),
      context("invalid"),
    );
    expect(response.status).toBe(401);
    expect(serviceCalls).not.toHaveBeenCalled();
  },
);
