import type * as ServerModule from "@/server/server";
import { NextRequest } from "next/server";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { createUser } from "@/test-support/fixtures/user";
import { UserNotFoundError } from "@/server/user/user-errors";
import { ActiveTrainingGoalAlreadyExistsError } from "@/server/training-goals/training-goals-errors";
import { GET, POST } from "./route";

const find = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", async (importOriginal) => {
  const actual = await importOriginal<typeof ServerModule>();
  const { DefaultRequestAuthenticationService } =
    await import("@/server/http/request-authentication-service");
  const { DefaultTrainingGoalsService } =
    await import("@/server/training-goals/training-goals-service");
  return {
    ...actual,
    requestAuthenticationService: new DefaultRequestAuthenticationService(
      () => ({ findBySessionKey }),
    ),
    getTrainingGoalsService: () =>
      new DefaultTrainingGoalsService({ create, find }),
  };
});

const goal = createTrainingGoal();
const body = { title: goal.title, type: goal.type };

beforeEach(() => {
  vi.resetAllMocks();
  findBySessionKey.mockResolvedValue(createUser({ id: goal.athleteId }));
  create.mockResolvedValue(goal);
  find.mockResolvedValue([goal]);
});

function post(
  bodyText = JSON.stringify(body),
  athleteId = goal.athleteId,
  cookie = "session-key",
) {
  const request = new NextRequest(
    `http://localhost/api/v1/athletes/${athleteId}/training-goals`,
    {
      method: "POST",
      body: bodyText,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie: `__Host-user-session=${cookie}` } : {}),
      },
    },
  );
  return POST(request, { params: Promise.resolve({ athleteId }) });
}

test("returns the created goal with 201 and private headers", async () => {
  const response = await post();
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(goal);
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
  expect(create).toHaveBeenCalledExactlyOnceWith({
    ...body,
    athleteId: goal.athleteId,
  });
});

test("accepts past dates and all optional targets even for OPEN goals", async () => {
  const input = {
    title: " Goal ",
    type: "OPEN",
    targetDate: "2000-01-01",
    targetDistanceMetres: 5000,
    targetTimeSeconds: 1200,
    description: " Details ",
  };
  create.mockResolvedValue(
    createTrainingGoal({
      ...input,
      type: "OPEN",
      title: "Goal",
      description: "Details",
    }),
  );
  const response = await post(JSON.stringify(input));
  expect(response.status).toBe(201);
  expect(create).toHaveBeenCalledExactlyOnceWith({
    ...input,
    title: "Goal",
    description: "Details",
    athleteId: goal.athleteId,
  });
});

test.each([
  ["{", "body"],
  [JSON.stringify({ ...body, title: " " }), "title"],
  [JSON.stringify({ ...body, targetTimeSeconds: -1 }), "targetTimeSeconds"],
  [JSON.stringify({ ...body, athleteId: goal.athleteId }), "athleteId"],
])(
  "returns structured 400 errors for invalid input %s",
  async (input, field) => {
    const response = await post(input);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).fieldErrors[field]).toEqual(
      expect.any(Array),
    );
    expect(create).not.toHaveBeenCalled();
  },
);

test("rejects missing authentication before reading the body", async () => {
  const response = await post("{", goal.athleteId, "");
  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(findBySessionKey).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

test("rejects invalid sessions", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());
  const response = await post();
  expect(response.status).toBe(401);
  expect(create).not.toHaveBeenCalled();
});

test("forbids creating another athlete's goal", async () => {
  const response = await post(
    JSON.stringify(body),
    "44444444-4444-4444-8444-444444444444",
  );
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  expect(create).not.toHaveBeenCalled();
});

test("handles authentication lookup failures", async () => {
  findBySessionKey.mockRejectedValue(new Error("Database unavailable"));
  const response = await post();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
  expect(create).not.toHaveBeenCalled();
});

test("handles persistence failures", async () => {
  create.mockRejectedValue(new Error("Database unavailable"));
  const response = await post();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to create training goal",
  });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

function get(athleteId = goal.athleteId, cookie = "session-key") {
  const request = new NextRequest(
    `http://localhost/api/v1/athletes/${athleteId}/training-goals`,
    { headers: cookie ? { cookie: `__Host-user-session=${cookie}` } : {} },
  );
  return GET(request, { params: Promise.resolve({ athleteId }) });
}

test("returns all goals in repository order with 200 and private headers", async () => {
  const goals = [
    createTrainingGoal({ createdAt: "2026-10-03T12:00:00.000Z" }),
    createTrainingGoal({
      status: "COMPLETED",
      createdAt: "2026-10-02T12:00:00.000Z",
    }),
    createTrainingGoal({
      status: "DISCARDED",
      createdAt: "2026-10-01T12:00:00.000Z",
    }),
  ];
  find.mockResolvedValue(goals);
  const response = await get();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(goals);
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
  expect(find).toHaveBeenCalledExactlyOnceWith(goal.athleteId);
});

test("returns an empty array when the athlete has no goals", async () => {
  find.mockResolvedValue([]);
  const response = await get();
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([]);
});

test("rejects GET without authentication before querying", async () => {
  const response = await get(goal.athleteId, "");
  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(findBySessionKey).not.toHaveBeenCalled();
  expect(find).not.toHaveBeenCalled();
});

test("rejects GET with an invalid session", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());
  const response = await get();
  expect(response.status).toBe(401);
  expect(find).not.toHaveBeenCalled();
});

test("forbids reading another athlete's goals", async () => {
  const response = await get("44444444-4444-4444-8444-444444444444");
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  expect(find).not.toHaveBeenCalled();
});

test("handles GET authentication lookup failures", async () => {
  findBySessionKey.mockRejectedValue(new Error("Database unavailable"));
  const response = await get();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
  expect(find).not.toHaveBeenCalled();
});

test("handles goal lookup failures with private headers", async () => {
  find.mockRejectedValue(new Error("Database unavailable"));
  const response = await get();
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to fetch training goals",
  });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

test("returns 409 when the athlete already has an active goal", async () => {
  create.mockRejectedValue(new ActiveTrainingGoalAlreadyExistsError());
  const response = await post();
  expect(response.status).toBe(409);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    error: "Athlete already has an active training goal",
  });
});
