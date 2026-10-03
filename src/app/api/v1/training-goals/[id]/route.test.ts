import type * as ServerModule from "@/server/server";
import { NextRequest } from "next/server";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { createUser } from "@/test-support/fixtures/user";
import { UserNotFoundError } from "@/server/user/user-errors";
import { PATCH } from "./route";

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  edit: vi.fn(),
  findBySessionKey: vi.fn(),
}));
vi.mock("@/server/server", async (importOriginal) => {
  const actual = await importOriginal<typeof ServerModule>();
  const { DefaultRequestAuthenticationService } =
    await import("@/server/http/request-authentication-service");
  const { DefaultTrainingGoalsService } =
    await import("@/server/training-goals/training-goals-service");
  return {
    ...actual,
    requestAuthenticationService: new DefaultRequestAuthenticationService(
      () => ({ findBySessionKey: mocks.findBySessionKey }),
    ),
    getTrainingGoalsService: () =>
      new DefaultTrainingGoalsService({
        complete: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        findById: mocks.findById,
        edit: mocks.edit,
      }),
  };
});
const goal = createTrainingGoal();
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findBySessionKey.mockResolvedValue(createUser({ id: goal.athleteId }));
  mocks.findById.mockResolvedValue(goal);
  mocks.edit.mockResolvedValue({ ...goal, title: "Updated" });
});
function patch(
  body = JSON.stringify({ title: "Updated" }),
  id = goal.id,
  cookie = "session-key",
) {
  return PATCH(
    new NextRequest(`http://localhost/api/v1/training-goals/${id}`, {
      method: "PATCH",
      body,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie: `__Host-user-session=${cookie}` } : {}),
      },
    }),
    { params: Promise.resolve({ id }) },
  );
}

test("returns the updated goal with private headers and unchanged metadata", async () => {
  const response = await patch();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ ...goal, title: "Updated" });
  expect(mocks.edit).toHaveBeenCalledExactlyOnceWith(goal.athleteId, goal.id, {
    title: "Updated",
  });
});

test("accepts all editable fields and null clearing", async () => {
  const input = {
    title: " Updated ",
    description: null,
    targetDate: null,
    targetTimeSeconds: null,
    targetDistanceMetres: null,
    type: "DISTANCE",
  };
  const response = await patch(JSON.stringify(input));
  expect(response.status).toBe(200);
  expect(mocks.edit).toHaveBeenCalledExactlyOnceWith(goal.athleteId, goal.id, {
    ...input,
    title: "Updated",
  });
});

test.each([
  "{",
  "{}",
  '{"status":"COMPLETED"}',
  '{"title":null}',
  '{"targetDate":"bad"}',
  '{"targetDistanceMetres":0}',
  '{"type":"BAD"}',
  '{"title":"Updated","athleteId":"other"}',
])("rejects invalid bodies %s before looking up the goal", async (body) => {
  const response = await patch(body);
  expect(response.status).toBe(400);
  expect((await response.json()).fieldErrors).toEqual(expect.any(Object));
  expect(mocks.findById).not.toHaveBeenCalled();
  expect(mocks.edit).not.toHaveBeenCalled();
});

test("rejects malformed route ids", async () => {
  const response = await patch(undefined, "not-a-uuid");
  expect(response.status).toBe(400);
  expect((await response.json()).fieldErrors.id).toEqual(expect.any(Array));
  expect(mocks.findById).not.toHaveBeenCalled();
});

test("authenticates before validating input", async () => {
  const response = await patch("{", "invalid", "");
  expect(response.status).toBe(401);
  expect(mocks.findBySessionKey).not.toHaveBeenCalled();
  expect(mocks.edit).not.toHaveBeenCalled();
});

test("rejects invalid sessions", async () => {
  mocks.findBySessionKey.mockRejectedValue(new UserNotFoundError());
  expect((await patch()).status).toBe(401);
  expect(mocks.findById).not.toHaveBeenCalled();
});

test("returns 404 for a missing goal", async () => {
  mocks.findById.mockResolvedValue(null);
  const response = await patch();
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training goal not found",
  });
  expect(mocks.edit).not.toHaveBeenCalled();
});

test("returns 403 for another athlete before checking status", async () => {
  mocks.findById.mockResolvedValue(
    createTrainingGoal({
      athleteId: "44444444-4444-4444-8444-444444444444",
      status: "COMPLETED",
    }),
  );
  const response = await patch();
  expect(response.status).toBe(403);
  expect(mocks.edit).not.toHaveBeenCalled();
});

test.each(["COMPLETED", "DISCARDED"] as const)(
  "returns 409 for %s goals",
  async (status) => {
    mocks.findById.mockResolvedValue({ ...goal, status });
    const response = await patch();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Only active training goals can be edited",
    });
    expect(mocks.edit).not.toHaveBeenCalled();
  },
);

test("returns 409 when the goal changes during the update", async () => {
  mocks.edit.mockResolvedValue(null);
  const response = await patch();
  expect(response.status).toBe(409);
});

test.each(["findById", "edit"] as const)(
  "handles %s database failures",
  async (operation) => {
    mocks[operation].mockRejectedValue(new Error("Database unavailable"));
    const response = await patch();
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Unable to edit training goal",
    });
  },
);

test("handles authentication lookup failures", async () => {
  mocks.findBySessionKey.mockRejectedValue(new Error("Database unavailable"));
  const response = await patch();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
  expect(mocks.findById).not.toHaveBeenCalled();
});
