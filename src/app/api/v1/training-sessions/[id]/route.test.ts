import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { trainingSessionsRequestValidator } from "@/server/server";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { DELETE, PATCH } from "./route";

const service = vi.hoisted(() => ({
  delete: vi.fn(),
  edit: vi.fn(),
}));

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  trainingSessionsRequestValidator: {
    validateEdit: vi.fn(),
  },
}));

const id = "11111111-1111-4111-8111-111111111111";
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
  });
}

function context(sessionId = id) {
  return { params: Promise.resolve({ id: sessionId }) };
}

function deleteRequest(sessionId = id) {
  return new NextRequest(
    `http://localhost/api/v1/training-sessions/${sessionId}`,
    { method: "DELETE" },
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
