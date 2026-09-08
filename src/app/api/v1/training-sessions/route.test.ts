import { NextRequest } from "next/server";

import { GET, POST } from "./route";
import { trainingSessionsRequestValidator } from "@/server/server";
import {
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
} from "@/server/training-sessions/training-sessions-errors";
import { BadRequestError } from "@/server/errors/bad-request-error";

const service = vi.hoisted(() => ({
  find: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
  trainingSessionsRequestValidator: {
    validateCreate: vi.fn(),
  },
}));

const requestValidator = vi.mocked(trainingSessionsRequestValidator);

class TestDatabaseError extends Error {
  constructor() {
    super("database down");
    this.name = "TestDatabaseError";
  }
}

test("returns sessions as JSON", async () => {
  service.find.mockResolvedValue([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "RUN",
      status: "SCHEDULED",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      actualDistanceMetres: null,
      actualDurationSeconds: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Strength",
      activityType: "STRENGTH",
      status: "COMPLETED",
      date: "2026-08-17",
      timeOfDay: "PM",
      description: "Lower body",
      sortOrder: 1,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDurationSeconds: 2700,
      actualDurationSeconds: 2400,
    },
  ]);

  const response = await GET(
    new NextRequest(
      "http://localhost/api/v1/training-sessions?from=2026-08-17&to=2026-08-23",
    ),
  );

  await expect(response.json()).resolves.toEqual([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "RUN",
      status: "SCHEDULED",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      actualDistanceMetres: null,
      actualDurationSeconds: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Strength",
      activityType: "STRENGTH",
      status: "COMPLETED",
      date: "2026-08-17",
      timeOfDay: "PM",
      description: "Lower body",
      sortOrder: 1,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDurationSeconds: 2700,
      actualDurationSeconds: 2400,
    },
  ]);
  expect(response.status).toBe(200);
  expect(service.find).toHaveBeenCalledWith({
    from: "2026-08-17",
    to: "2026-08-23",
    status: undefined,
  });
});

test.each([
  [
    "?from=2026-08-17",
    { from: "2026-08-17", to: undefined, status: undefined },
  ],
  ["?to=2026-08-23", { from: undefined, to: "2026-08-23", status: undefined }],
  [
    "?status=SCHEDULED",
    { from: undefined, to: undefined, status: "SCHEDULED" },
  ],
  [
    "?to=2026-08-23&status=SCHEDULED",
    { from: undefined, to: "2026-08-23", status: "SCHEDULED" },
  ],
  ["", { from: undefined, to: undefined, status: undefined }],
])("passes optional query filters to the service", async (search, query) => {
  service.find.mockResolvedValue([]);

  const response = await GET(
    new NextRequest(`http://localhost/api/v1/training-sessions${search}`),
  );

  expect(response.status).toBe(200);
  expect(service.find).toHaveBeenCalledWith(query);
});

test("returns validation errors with 400 status", async () => {
  service.find.mockRejectedValue(
    new TrainingSessionsValidationError("Invalid range"),
  );

  const response = await GET(
    new NextRequest(
      "http://localhost/api/v1/training-sessions?from=bad&to=2026-08-23",
    ),
  );

  await expect(response.json()).resolves.toEqual({ error: "Invalid range" });
  expect(response.status).toBe(400);
});

test("returns stable server errors with 500 status", async () => {
  service.find.mockRejectedValue(new TestDatabaseError());

  const response = await GET(
    new NextRequest(
      "http://localhost/api/v1/training-sessions?from=2026-08-17&to=2026-08-23",
    ),
  );

  await expect(response.json()).resolves.toEqual({
    error: "Unable to fetch training sessions",
  });
  expect(response.status).toBe(500);
});

test("returns validator field errors with 400 status", async () => {
  requestValidator.validateCreate.mockImplementation(() => {
    throw new TrainingSessionsRequestValidationError({
      title: ["Invalid input: expected string, received undefined"],
    });
  });

  const response = await POST(
    new NextRequest("http://localhost/api/v1/training-sessions", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: {
      title: ["Invalid input: expected string, received undefined"],
    },
  });
});

test("returns malformed JSON errors with 400 status", async () => {
  const response = await POST(
    new NextRequest("http://localhost/api/v1/training-sessions", {
      method: "POST",
      body: "{",
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
});

test("creates a training session with 201 status", async () => {
  const request = {
    title: "Strength",
    activityType: "STRENGTH" as const,
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: 1800,
  };
  const session = {
    ...request,
    id: "11111111-1111-4111-8111-111111111111",
    status: "SCHEDULED" as const,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-26T10:00:00.000Z",
    updatedAt: "2026-08-26T10:00:00.000Z",
    actualDurationSeconds: null,
  };
  requestValidator.validateCreate.mockReturnValue(request);
  service.create.mockResolvedValue(session);

  const response = await POST(
    new NextRequest("http://localhost/api/v1/training-sessions", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual(session);
  expect(requestValidator.validateCreate).toHaveBeenCalledWith(request);
  expect(service.create).toHaveBeenCalledWith(request);
});

test("returns creation business errors with 400 status", async () => {
  requestValidator.validateCreate.mockReturnValue({
    title: "Strength",
    activityType: "STRENGTH",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  });
  service.create.mockRejectedValue(new BadRequestError("Invalid activity"));

  const response = await POST(
    new NextRequest("http://localhost/api/v1/training-sessions", {
      method: "POST",
      body: JSON.stringify({ activityType: "STRENGTH" }),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid activity" });
});

test("returns stable creation errors with 500 status", async () => {
  requestValidator.validateCreate.mockReturnValue({
    title: "Strength",
    activityType: "STRENGTH",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  });
  service.create.mockRejectedValue(new TestDatabaseError());

  const response = await POST(
    new NextRequest("http://localhost/api/v1/training-sessions", {
      method: "POST",
      body: JSON.stringify({ activityType: "STRENGTH" }),
    }),
  );

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to create training session",
  });
});
