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
import { DELETE, PATCH } from "./route";

const service = vi.hoisted(() => ({
  findById: vi.fn(),
  delete: vi.fn(),
  edit: vi.fn(),
}));

const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  getUserService: () => ({ findBySessionKey }),
  trainingSessionsRequestValidator: {
    validateEdit: vi.fn(),
  },
}));

const id = "11111111-1111-4111-8111-111111111111";
const athleteId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  findBySessionKey.mockResolvedValue(createUser({ id: athleteId }));
  service.findById.mockResolvedValue({ id, athleteId });
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

const validator = vi.mocked(trainingSessionsRequestValidator);

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
  service.delete.mockResolvedValue(undefined);

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(204);
  await expect(response.text()).resolves.toBe("");
  expect(service.delete).toHaveBeenCalledWith(id);
});

test("returns invalid delete ids with 400 status", async () => {
  service.delete.mockRejectedValue(
    new TrainingSessionsValidationError(
      "training session id must be a valid UUID",
    ),
  );

  const response = await DELETE(deleteRequest("invalid"), context("invalid"));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "training session id must be a valid UUID",
  });
  expect(service.delete).toHaveBeenCalledWith("invalid");
});

test("returns missing delete targets with 404 status", async () => {
  service.delete.mockRejectedValue(new TrainingSessionNotFoundError());

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training session not found",
  });
});

test("returns stable deletion errors with 500 status", async () => {
  service.delete.mockRejectedValue(new Error("database down"));

  const response = await DELETE(deleteRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to delete training session",
  });
});

test("edits and returns a complete training session", async () => {
  validator.validateEdit.mockReturnValue(editRequest);
  service.edit.mockResolvedValue(editedSession);

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(editedSession);
  expect(validator.validateEdit).toHaveBeenCalledWith(editRequest);
  expect(service.edit).toHaveBeenCalledWith(id, editRequest);
});

test("returns malformed JSON errors with 400 status", async () => {
  const response = await PATCH(patchRequest("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
});

test("returns edit field errors with 400 status", async () => {
  validator.validateEdit.mockImplementation(() => {
    throw new TrainingSessionsRequestValidationError({
      title: ["Required"],
    });
  });

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { title: ["Required"] },
  });
});

test("returns business validation errors with 400 status", async () => {
  validator.validateEdit.mockReturnValue(editRequest);
  service.edit.mockRejectedValue(
    new BadRequestError("activityType cannot be changed"),
  );

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "activityType cannot be changed",
  });
});

test("returns invalid session ids with 400 status", async () => {
  validator.validateEdit.mockReturnValue(editRequest);
  service.edit.mockRejectedValue(
    new TrainingSessionsValidationError(
      "training session id must be a valid UUID",
    ),
  );

  const response = await PATCH(patchRequest(), context("invalid"));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "training session id must be a valid UUID",
  });
  expect(service.edit).toHaveBeenCalledWith("invalid", editRequest);
});

test("returns missing sessions with 404 status", async () => {
  validator.validateEdit.mockReturnValue(editRequest);
  service.edit.mockRejectedValue(new TrainingSessionNotFoundError());

  const response = await PATCH(patchRequest(), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training session not found",
  });
});

test("returns stable edit errors with 500 status", async () => {
  validator.validateEdit.mockReturnValue(editRequest);
  service.edit.mockRejectedValue(new Error("database down"));

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
    service.findById.mockResolvedValue({ id, athleteId: "other-id" });
  if (kind === "absent")
    service.findById.mockRejectedValue(new TrainingSessionNotFoundError());

  const response = await DELETE(request, context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(service.delete).not.toHaveBeenCalled();
});

test.each([
  ["missing cookie", 401, "missing"],
  ["invalid cookie", 401, "invalid"],
  ["other athlete", 403, "foreign"],
  ["missing session", 404, "absent"],
])(
  "PATCH denies %s before body validation or mutation",
  async (_label, status, kind) => {
    const request = patchRequest("{");
    if (kind === "missing") request.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    if (kind === "foreign")
      service.findById.mockResolvedValue({ id, athleteId: "other-id" });
    if (kind === "absent")
      service.findById.mockRejectedValue(new TrainingSessionNotFoundError());

    const response = await PATCH(request, context());
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(validator.validateEdit).not.toHaveBeenCalled();
    expect(service.edit).not.toHaveBeenCalled();
  },
);

test.each([
  ["actor lookup failure", 500, "actor"],
  ["invalid id", 400, "invalid"],
  ["session lookup failure", 500, "lookup"],
])("DELETE maps %s before mutation", async (_label, status, kind) => {
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

  const response = await DELETE(deleteRequest(), context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(service.delete).not.toHaveBeenCalled();
});

test.each([
  ["actor lookup failure", 500, "actor"],
  ["invalid id", 400, "invalid"],
  ["session lookup failure", 500, "lookup"],
])("PATCH maps %s before mutation", async (_label, status, kind) => {
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

  const response = await PATCH(patchRequest("{"), context());
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(validator.validateEdit).not.toHaveBeenCalled();
  expect(service.edit).not.toHaveBeenCalled();
});
