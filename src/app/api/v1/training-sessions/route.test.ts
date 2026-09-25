import { NextRequest } from "next/server";

import { GET } from "./route";
import { TrainingSessionsValidationError } from "@/server/training-sessions/training-sessions-errors";

const service = vi.hoisted(() => ({
  find: vi.fn(),
}));

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
}));

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
      athleteId: "33333333-3333-4333-8333-333333333333",
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
      athleteId: "33333333-3333-4333-8333-333333333333",
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
      athleteId: "33333333-3333-4333-8333-333333333333",
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
      athleteId: "33333333-3333-4333-8333-333333333333",
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
