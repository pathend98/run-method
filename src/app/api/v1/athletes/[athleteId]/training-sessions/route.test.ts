import { NextRequest } from "next/server";

import {
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { UserNotFoundError } from "@/server/user/user-errors";
import { trainingSessionsRequestValidator } from "@/server/server";
import { GET, POST } from "./route";

const service = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn() }));

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  trainingSessionsRequestValidator: { validateCreate: vi.fn() },
}));

const requestValidator = vi.mocked(trainingSessionsRequestValidator);

beforeEach(() => vi.clearAllMocks());

const athleteId = "33333333-3333-4333-8333-333333333333";

function request(id = athleteId, query = "") {
  return new NextRequest(
    `http://localhost/api/v1/athletes/${id}/training-sessions${query}`,
  );
}

function context(id = athleteId) {
  return { params: Promise.resolve({ athleteId: id }) };
}

test("returns sessions for an athlete with the existing query filters", async () => {
  const sessions = [{ id: "11111111-1111-4111-8111-111111111111" }];
  service.find.mockResolvedValue(sessions);

  const response = await GET(
    request(athleteId, "?from=2026-08-17&to=2026-08-23&status=SCHEDULED"),
    context(),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(sessions);
  expect(service.find).toHaveBeenCalledWith({
    athleteId,
    from: "2026-08-17",
    to: "2026-08-23",
    status: "SCHEDULED",
  });
});

test("returns an empty list when an athlete has no sessions", async () => {
  service.find.mockResolvedValue([]);

  const response = await GET(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([]);
  expect(service.find).toHaveBeenCalledWith({
    athleteId,
    from: undefined,
    to: undefined,
    status: undefined,
  });
});

test.each([
  ["invalid athlete id", "invalid", "", "athlete id must be a valid UUID"],
  [
    "invalid query",
    athleteId,
    "?status=DUE",
    "status must be SCHEDULED, COMPLETED, or SKIPPED",
  ],
])("returns 400 for %s", async (_label, id, query, message) => {
  service.find.mockRejectedValue(new TrainingSessionsValidationError(message));

  const response = await GET(request(id, query), context(id));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: message });
});

test("returns 500 for unexpected failures", async () => {
  service.find.mockRejectedValue(new Error("database down"));

  const response = await GET(request(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to fetch training sessions",
  });
});

function postRequest(body: string, id = athleteId) {
  return new NextRequest(
    `http://localhost/api/v1/athletes/${id}/training-sessions`,
    { method: "POST", body },
  );
}

test.each([
  {
    activityType: "RUN",
    title: "Easy run",
    date: "2026-08-26",
    timeOfDay: "AM",
    description: null,
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  },
  {
    activityType: "STRENGTH",
    title: "Strength",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  },
])("creates an athlete $activityType session", async (body) => {
  const session = { id: "11111111-1111-4111-8111-111111111111", ...body };
  requestValidator.validateCreate.mockReturnValue(body as never);
  service.create.mockResolvedValue(session);

  const response = await POST(postRequest(JSON.stringify(body)), context());

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual(session);
  expect(requestValidator.validateCreate).toHaveBeenCalledWith(body);
  expect(service.create).toHaveBeenCalledWith({ ...body, userId: athleteId });
});

test("returns 400 for malformed JSON", async () => {
  const response = await POST(postRequest("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
  expect(service.create).not.toHaveBeenCalled();
});

test("returns field errors for invalid session fields", async () => {
  requestValidator.validateCreate.mockImplementation(() => {
    throw new TrainingSessionsRequestValidationError({ title: ["Required"] });
  });

  const response = await POST(postRequest("{}"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { title: ["Required"] },
  });
  expect(service.create).not.toHaveBeenCalled();
});

test("returns 400 for an invalid athlete ID", async () => {
  requestValidator.validateCreate.mockReturnValue({} as never);
  service.create.mockRejectedValue(
    new TrainingSessionsValidationError("athlete id must be a valid UUID"),
  );

  const response = await POST(postRequest("{}", "invalid"), context("invalid"));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "athlete id must be a valid UUID",
  });
});

test("returns 404 when the athlete does not exist", async () => {
  requestValidator.validateCreate.mockReturnValue({} as never);
  service.create.mockRejectedValue(new UserNotFoundError());

  const response = await POST(postRequest("{}"), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "User not found",
  });
});

test("returns 500 for unexpected creation failures", async () => {
  requestValidator.validateCreate.mockReturnValue({} as never);
  service.create.mockRejectedValue(new Error("database down"));

  const response = await POST(postRequest("{}"), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to create training session",
  });
});
