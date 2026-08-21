import { NextRequest } from "next/server";

import { GET } from "./route";
import { trainingSessionsService } from "@/server/server";
import { TrainingSessionsValidationError } from "@/server/training-sessions/training-sessions-errors";

vi.mock("@/server/server", () => ({
  trainingSessionsService: {
    findBetweenDates: vi.fn(),
  },
}));

const service = vi.mocked(trainingSessionsService);

class TestDatabaseError extends Error {
  constructor() {
    super("database down");
    this.name = "TestDatabaseError";
  }
}

test("returns sessions as JSON", async () => {
  service.findBetweenDates.mockResolvedValue([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
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
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
    },
  ]);
  expect(response.status).toBe(200);
  expect(service.findBetweenDates).toHaveBeenCalledWith(
    "2026-08-17",
    "2026-08-23",
  );
});

test("returns validation errors with 400 status", async () => {
  service.findBetweenDates.mockRejectedValue(
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
  service.findBetweenDates.mockRejectedValue(new TestDatabaseError());

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
