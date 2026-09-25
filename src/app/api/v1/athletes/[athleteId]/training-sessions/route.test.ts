import { NextRequest } from "next/server";

import { TrainingSessionsValidationError } from "@/server/training-sessions/training-sessions-errors";
import { GET } from "./route";

const service = vi.hoisted(() => ({ find: vi.fn() }));

vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
}));

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
