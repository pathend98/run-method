import {
  createTrainingSession,
  completeTrainingSession,
  deleteTrainingSession,
  editTrainingSession,
  fetchTrainingSessions,
  skipTrainingSession,
} from "./training-sessions-api-client";

const createRequest = {
  title: "Strength",
  activityType: "STRENGTH" as const,
  date: "2026-08-26",
  timeOfDay: null,
  description: null,
  targetDurationSeconds: 1800,
};

const createdSession = {
  ...createRequest,
  id: "11111111-1111-4111-8111-111111111111",
  status: "SCHEDULED" as const,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-26T10:00:00.000Z",
  updatedAt: "2026-08-26T10:00:00.000Z",
  actualDurationSeconds: null,
};

test("fetchTrainingSessions calls the API and parses sessions", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
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
          targetType: "DISTANCE_DURATION",
          targetDistanceMetres: 8000,
          targetDurationSeconds: 2700,
          targetPaceSecondsPerKilometre: null,
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
      ]),
    }),
  );

  await expect(
    fetchTrainingSessions({ from: "2026-08-17", to: "2026-08-23" }),
  ).resolves.toEqual([
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
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      targetPaceSecondsPerKilometre: null,
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

test("createTrainingSession posts and parses the created session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(createdSession),
    }),
  );

  await expect(createTrainingSession(createRequest)).resolves.toEqual(
    createdSession,
  );
  expect(fetch).toHaveBeenCalledWith("/api/v1/training-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createRequest),
  });
});

test("createTrainingSession returns API messages and field errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: "Invalid request body",
        fieldErrors: { title: ["Required"] },
      }),
    }),
  );

  await expect(createTrainingSession(createRequest)).rejects.toMatchObject({
    message: "Invalid request body",
    status: 400,
    fieldErrors: { title: ["Required"] },
  });
});

test.each([undefined, null, "invalid", { title: "invalid" }, { title: [1] }])(
  "createTrainingSession ignores invalid field errors %#",
  async (fieldErrors) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ fieldErrors }),
      }),
    );

    await expect(createTrainingSession(createRequest)).rejects.toMatchObject({
      message: "Unable to create training session",
      status: 500,
      fieldErrors: undefined,
    });
  },
);

test("createTrainingSession falls back for a non-JSON error body", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError("not JSON")),
    }),
  );

  await expect(createTrainingSession(createRequest)).rejects.toMatchObject({
    message: "Unable to create training session",
    status: 502,
    fieldErrors: undefined,
  });
});

const editRequest = {
  title: "Updated strength",
  activityType: "STRENGTH" as const,
  timeOfDay: "PM" as const,
  description: "Lower body",
  targetDurationSeconds: 2400,
};

const editedSession = {
  ...createdSession,
  ...editRequest,
  updatedAt: "2026-08-31T10:00:00.000Z",
};

test("editTrainingSession patches and parses the edited session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(editedSession),
    }),
  );

  await expect(
    editTrainingSession(createdSession.id, editRequest),
  ).resolves.toEqual(editedSession);
  expect(fetch).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${createdSession.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editRequest),
    },
  );
});

test("editTrainingSession returns API messages and field errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: "Invalid request body",
        fieldErrors: { title: ["Required"] },
      }),
    }),
  );

  await expect(
    editTrainingSession(createdSession.id, editRequest),
  ).rejects.toMatchObject({
    message: "Invalid request body",
    status: 400,
    fieldErrors: { title: ["Required"] },
  });
});

test("editTrainingSession falls back for non-JSON errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError("not JSON")),
    }),
  );

  await expect(
    editTrainingSession(createdSession.id, editRequest),
  ).rejects.toMatchObject({
    message: "Unable to edit training session",
    status: 502,
    fieldErrors: undefined,
  });
});

test("deleteTrainingSession sends a DELETE request and accepts an empty response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 204 }),
  );

  await expect(
    deleteTrainingSession(createdSession.id),
  ).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${createdSession.id}`,
    { method: "DELETE" },
  );
});

test("deleteTrainingSession returns API messages", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: "Training session not found" }),
    }),
  );

  await expect(deleteTrainingSession(createdSession.id)).rejects.toMatchObject({
    message: "Training session not found",
    status: 404,
  });
});

test("deleteTrainingSession falls back for non-JSON errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError("not JSON")),
    }),
  );

  await expect(deleteTrainingSession(createdSession.id)).rejects.toMatchObject({
    message: "Unable to delete training session",
    status: 502,
  });
});

test("skipTrainingSession posts the reason and parses the skipped session", async () => {
  const skippedSession = { ...createdSession, status: "SKIPPED" as const, skipReason: "Recovery" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(skippedSession) }));

  await expect(skipTrainingSession(createdSession.id, { skipReason: "Recovery" })).resolves.toEqual(skippedSession);
  expect(fetch).toHaveBeenCalledWith(`/api/v1/training-sessions/${createdSession.id}/skip`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skipReason: "Recovery" }),
  });
});

test("completeTrainingSession posts actuals and parses the completed session", async () => {
  const completedSession = { ...createdSession, status: "COMPLETED" as const, actualDurationSeconds: 1800 };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(completedSession) }));

  await expect(completeTrainingSession(createdSession.id, { actualDurationSeconds: 1800 })).resolves.toEqual(completedSession);
  expect(fetch).toHaveBeenCalledWith(`/api/v1/training-sessions/${createdSession.id}/complete`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actualDurationSeconds: 1800 }),
  });
});

test("skipTrainingSession preserves API field errors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false, status: 400, json: vi.fn().mockResolvedValue({ error: "Invalid request", fieldErrors: { skipReason: ["Required"] } }),
  }));

  await expect(skipTrainingSession(createdSession.id, { skipReason: "Recovery" })).rejects.toMatchObject({
    message: "Invalid request", status: 400, fieldErrors: { skipReason: ["Required"] },
  });
});

test("completeTrainingSession falls back for a non-JSON error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false, status: 502, json: vi.fn().mockRejectedValue(new SyntaxError("not JSON")),
  }));

  await expect(completeTrainingSession(createdSession.id, { actualDurationSeconds: 1800 })).rejects.toMatchObject({
    message: "Unable to complete training session", status: 502, fieldErrors: undefined,
  });
});
