import { createTrainingGoal as goalFixture } from "@/test-support/fixtures/training-goal";
import {
  createTrainingGoal,
  fetchTrainingGoals,
} from "./training-goals-api-client";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

test("fetches and validates the athlete's goals", async () => {
  const goal = goalFixture();
  fetchMock.mockResolvedValue(new Response(JSON.stringify([goal])));
  expect(await fetchTrainingGoals("athlete/id")).toEqual([goal]);
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/athletes/athlete%2Fid/training-goals",
    { cache: "no-store" },
  );
});

test("creates and validates a goal", async () => {
  const goal = goalFixture();
  const request = { title: goal.title, type: goal.type };
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(goal), { status: 201 }),
  );
  expect(await createTrainingGoal(goal.athleteId, request)).toEqual(goal);
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/athletes/${goal.athleteId}/training-goals`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
});

test.each([null, "error", {}, { error: 42 }, { error: "Forbidden" }])(
  "handles unsuccessful JSON responses: %j",
  async (body) => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), { status: 403 }),
    );
    await expect(fetchTrainingGoals("athlete")).rejects.toThrow(
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : "Unable to fetch training goals",
    );
  },
);

test("handles a non-JSON creation error", async () => {
  fetchMock.mockResolvedValue(new Response("Unavailable", { status: 503 }));
  await expect(
    createTrainingGoal("athlete", { title: "Goal", type: "OPEN" }),
  ).rejects.toThrow("Unable to create training goal");
});

test.each(["fetch", "create"])(
  "rejects malformed successful %s responses",
  async (operation) => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "Invalid" })),
    );
    await expect(
      operation === "fetch"
        ? fetchTrainingGoals("athlete")
        : createTrainingGoal("athlete", { title: "Goal", type: "RACE" }),
    ).rejects.toThrow();
  },
);
