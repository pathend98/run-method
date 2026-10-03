import type * as ServerModule from "@/server/server";
import { NextRequest } from "next/server";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { createUser } from "@/test-support/fixtures/user";
import { UserNotFoundError } from "@/server/user/user-errors";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  discard: vi.fn(),
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
        edit: vi.fn(),
        discard: mocks.discard,
      }),
  };
});
const goal = createTrainingGoal();
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findBySessionKey.mockResolvedValue(createUser({ id: goal.athleteId }));
  mocks.findById.mockResolvedValue(goal);
  mocks.discard.mockResolvedValue({ ...goal, status: "DISCARDED" });
});
function post(
  body: string | undefined = undefined,
  id = goal.id,
  cookie = "session-key",
) {
  return POST(
    new NextRequest(`http://localhost/api/v1/training-goals/${id}/discard`, {
      method: "POST",
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
  const response = await post();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    ...goal,
    status: "DISCARDED",
  });
  expect(mocks.discard).toHaveBeenCalledExactlyOnceWith(
    goal.athleteId,
    goal.id,
  );
});

test("rejects malformed route ids", async () => {
  const response = await post(undefined, "not-a-uuid");
  expect(response.status).toBe(400);
  expect((await response.json()).fieldErrors.id).toEqual(expect.any(Array));
  expect(mocks.findById).not.toHaveBeenCalled();
});

test("authenticates before validating input", async () => {
  const response = await post("{", "invalid", "");
  expect(response.status).toBe(401);
  expect(mocks.findBySessionKey).not.toHaveBeenCalled();
  expect(mocks.discard).not.toHaveBeenCalled();
});

test("rejects invalid sessions", async () => {
  mocks.findBySessionKey.mockRejectedValue(new UserNotFoundError());
  expect((await post()).status).toBe(401);
  expect(mocks.findById).not.toHaveBeenCalled();
});

test("returns 404 for a missing goal", async () => {
  mocks.findById.mockResolvedValue(null);
  const response = await post();
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "Training goal not found",
  });
  expect(mocks.discard).not.toHaveBeenCalled();
});

test("returns 403 for another athlete before checking status", async () => {
  mocks.findById.mockResolvedValue(
    createTrainingGoal({
      athleteId: "44444444-4444-4444-8444-444444444444",
      status: "DISCARDED",
    }),
  );
  const response = await post();
  expect(response.status).toBe(403);
  expect(mocks.discard).not.toHaveBeenCalled();
});

test.each(["COMPLETED", "DISCARDED"] as const)(
  "returns 409 for %s goals",
  async (status) => {
    mocks.findById.mockResolvedValue({ ...goal, status });
    const response = await post();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Only active training goals can be discarded",
    });
    expect(mocks.discard).not.toHaveBeenCalled();
  },
);

test("returns 409 when the goal changes during the update", async () => {
  mocks.discard.mockResolvedValue(null);
  const response = await post();
  expect(response.status).toBe(409);
});

test.each(["findById", "discard"] as const)(
  "handles %s database failures",
  async (operation) => {
    mocks[operation].mockRejectedValue(new Error("Database unavailable"));
    const response = await post();
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Unable to discard training goal",
    });
  },
);

test("handles authentication lookup failures", async () => {
  mocks.findBySessionKey.mockRejectedValue(new Error("Database unavailable"));
  const response = await post();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
  expect(mocks.findById).not.toHaveBeenCalled();
});

test("does not read a supplied request body", async () => {
  expect((await post("{")).status).toBe(200);
});
