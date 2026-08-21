import { fetchTrainingSessions } from "./training-sessions-client";
import { TrainingSessionsApiError } from "./training-sessions-errors";

test("fetchTrainingSessions calls the API and parses sessions", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Easy run",
          activityType: "Run",
          date: "2026-08-17",
          timeOfDay: "AM",
          description: null,
          sortOrder: 0,
        },
      ]),
    }),
  );

  await expect(
    fetchTrainingSessions({ from: "2026-08-17", to: "2026-08-23" }),
  ).resolves.toEqual([
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
  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/training-sessions?from=2026-08-17&to=2026-08-23",
  );
});

test("fetchTrainingSessions throws stable API errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: "Invalid range" }),
    }),
  );

  await expect(
    fetchTrainingSessions({ from: "bad", to: "2026-08-23" }),
  ).rejects.toMatchObject({
    message: "Invalid range",
    status: 400,
  });
  await expect(
    fetchTrainingSessions({ from: "bad", to: "2026-08-23" }),
  ).rejects.toBeInstanceOf(TrainingSessionsApiError);
});

test("fetchTrainingSessions falls back when error JSON has no message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    }),
  );

  await expect(
    fetchTrainingSessions({ from: "2026-08-17", to: "2026-08-23" }),
  ).rejects.toThrow("Unable to fetch training sessions");
});

test("fetchTrainingSessions falls back when error body is not JSON", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token <")),
    }),
  );

  await expect(
    fetchTrainingSessions({ from: "2026-08-17", to: "2026-08-23" }),
  ).rejects.toMatchObject({
    message: "Unable to fetch training sessions",
    status: 502,
  });
});
