import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";

function createService() {
  const repository: TrainingSessionsRepository = {
    findBetweenDates: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    skip: vi.fn(),
    complete: vi.fn(),
    edit: vi.fn(),
  };
  const validator: TrainingSessionsValidator = {
    validateEdit: vi.fn(),
    validateSkip: vi.fn(),
    validateComplete: vi.fn(),
  };

  return {
    repository,
    validator,
    service: new DefaultTrainingSessionsService(repository, validator),
  };
}

test("requires from and to dates", async () => {
  const { service } = createService();

  await expect(service.findBetweenDates(null, "2026-08-23")).rejects.toThrow(
    "from and to query parameters are required",
  );
});

test("rejects invalid date strings", async () => {
  const { service } = createService();

  await expect(
    service.findBetweenDates("2026-02-30", "2026-08-23"),
  ).rejects.toThrow("from and to must be valid dates in YYYY-MM-DD format");
});

test("rejects inverted and oversized ranges", async () => {
  const { service } = createService();

  await expect(
    service.findBetweenDates("2026-08-24", "2026-08-23"),
  ).rejects.toThrow("from must be before or equal to to");
  await expect(
    service.findBetweenDates("2026-08-01", "2026-09-02"),
  ).rejects.toThrow("date range must not exceed 31 days");
});

test("delegates valid ranges to the repository", async () => {
  const { repository, service } = createService();

  await expect(
    service.findBetweenDates("2026-08-17", "2026-08-23"),
  ).resolves.toEqual([]);
  expect(repository.findBetweenDates).toHaveBeenCalledWith(
    "2026-08-17",
    "2026-08-23",
  );
});

test("delegates creation to the repository", async () => {
  const { repository, service } = createService();
  const request = {
    title: "Strength",
    activityType: "STRENGTH" as const,
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: 1800,
  };
  const created = {
    ...request,
    id: "11111111-1111-4111-8111-111111111111",
    status: "SCHEDULED" as const,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-26T10:00:00.000Z",
    updatedAt: "2026-08-26T10:00:00.000Z",
    actualDurationSeconds: null,
  };
  vi.mocked(repository.create).mockResolvedValue(created);

  await expect(service.create(request)).resolves.toEqual(created);
  expect(repository.create).toHaveBeenCalledWith(request);
});

test("rejects invalid delete ids before deleting from the repository", async () => {
  const { repository, service } = createService();

  await expect(service.delete("invalid")).rejects.toThrow(
    "training session id must be a valid UUID",
  );
  expect(repository.deleteById).not.toHaveBeenCalled();
});

test("deletes a training session by id", async () => {
  const { repository, service } = createService();
  const id = "11111111-1111-4111-8111-111111111111";
  vi.mocked(repository.deleteById).mockResolvedValue(true);

  await expect(service.delete(id)).resolves.toBeUndefined();
  expect(repository.deleteById).toHaveBeenCalledWith(id);
});

test("reports a missing training session during deletion", async () => {
  const { repository, service } = createService();
  const id = "11111111-1111-4111-8111-111111111111";
  vi.mocked(repository.deleteById).mockResolvedValue(false);

  await expect(service.delete(id)).rejects.toBeInstanceOf(
    TrainingSessionNotFoundError,
  );
});

test("skips a scheduled training session", async () => {
  const { repository, service, validator } = createService();
  const skipped = {
    ...runSession,
    status: "SKIPPED" as const,
    skipReason: "Recovery",
  };
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(repository.skip).mockResolvedValue(skipped);

  await expect(
    service.skip(runSession.id, { skipReason: "Recovery" }),
  ).resolves.toBe(skipped);
  expect(validator.validateSkip).toHaveBeenCalledWith(runSession);
  expect(repository.skip).toHaveBeenCalledWith(runSession, {
    skipReason: "Recovery",
  });
});

test("completes a scheduled training session", async () => {
  const { repository, service, validator } = createService();
  const request = {
    actualDurationSeconds: 1500,
    actualDistanceMetres: 5000,
  };
  const completed = {
    ...runSession,
    status: "COMPLETED" as const,
    actualDurationSeconds: 1500,
    actualDistanceMetres: 5000,
  };
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(repository.complete).mockResolvedValue(completed);

  await expect(service.complete(runSession.id, request)).resolves.toBe(
    completed,
  );
  expect(validator.validateComplete).toHaveBeenCalledWith(runSession, request);
  expect(repository.complete).toHaveBeenCalledWith(runSession, request);
});

test.each(["skip", "complete"] as const)(
  "validates %s ids before loading a session",
  async (operation) => {
    const { repository, service } = createService();

    const result =
      operation === "skip"
        ? service.skip("invalid", { skipReason: "Recovery" })
        : service.complete("invalid", { actualDurationSeconds: 1500 });

    await expect(result).rejects.toThrow(
      "training session id must be a valid UUID",
    );
    expect(repository.findById).not.toHaveBeenCalled();
  },
);

test.each(["skip", "complete"] as const)(
  "reports missing sessions during %s",
  async (operation) => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const result =
      operation === "skip"
        ? service.skip(runSession.id, { skipReason: "Recovery" })
        : service.complete(runSession.id, { actualDurationSeconds: 1500 });

    await expect(result).rejects.toBeInstanceOf(TrainingSessionNotFoundError);
  },
);

test.each(["skip", "complete"] as const)(
  "reports a concurrent %s transition",
  async (operation) => {
    const { repository, service } = createService();
    vi.mocked(repository.findById).mockResolvedValue(runSession);
    vi.mocked(repository[operation]).mockResolvedValue(null);

    const result =
      operation === "skip"
        ? service.skip(runSession.id, { skipReason: "Recovery" })
        : service.complete(runSession.id, {
            actualDurationSeconds: 1500,
            actualDistanceMetres: 5000,
          });

    await expect(result).rejects.toThrow(
      "training session is no longer scheduled",
    );
  },
);

const runSession: TrainingSession = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-26",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const runEdit: EditTrainingSessionRequest = {
  title: "Long easy run",
  description: "Keep it relaxed",
  timeOfDay: "PM",
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
};

test("rejects invalid edit ids before querying the repository", async () => {
  const { repository, service, validator } = createService();

  await expect(service.edit("invalid", runEdit)).rejects.toThrow(
    "training session id must be a valid UUID",
  );
  expect(repository.findById).not.toHaveBeenCalled();
  expect(validator.validateEdit).not.toHaveBeenCalled();
});

test("reports missing sessions", async () => {
  const { repository, service } = createService();
  vi.mocked(repository.findById).mockResolvedValue(null);

  await expect(service.edit(runSession.id, runEdit)).rejects.toBeInstanceOf(
    TrainingSessionNotFoundError,
  );
});

test("validates and edits a scheduled run", async () => {
  const { repository, service, validator } = createService();
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(repository.edit).mockResolvedValue({
    ...runSession,
    ...runEdit,
    targetPaceSecondsPerKilometre: null,
  });

  await service.edit(runSession.id, runEdit);

  expect(validator.validateEdit).toHaveBeenCalledWith(runSession, runEdit);
  expect(repository.edit).toHaveBeenCalledWith(runSession, runEdit);
});

test("validates before returning an unchanged session", async () => {
  const { repository, service, validator } = createService();
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(validator.validateEdit).mockImplementation(() => {
    throw new TrainingSessionsValidationError("edit rejected");
  });

  await expect(
    service.edit(runSession.id, {
      title: runSession.title,
      description: runSession.description,
      timeOfDay: runSession.timeOfDay,
      activityType: "RUN",
      targetType: runSession.targetType,
      targetDistanceMetres: runSession.targetDistanceMetres,
      targetDurationSeconds: runSession.targetDurationSeconds,
    }),
  ).rejects.toThrow("edit rejected");
  expect(repository.edit).not.toHaveBeenCalled();
});

test("allows terminal title and description edits", async () => {
  const { repository, service } = createService();
  const skipped = {
    ...runSession,
    status: "SKIPPED" as const,
    skipReason: "Sick",
  };
  const edit = {
    ...runEdit,
    title: "Revised title",
    timeOfDay: skipped.timeOfDay,
    targetDistanceMetres: skipped.targetDistanceMetres,
    targetDurationSeconds: skipped.targetDurationSeconds,
  };
  vi.mocked(repository.findById).mockResolvedValue(skipped);
  vi.mocked(repository.edit).mockResolvedValue({ ...skipped, ...edit });

  await service.edit(skipped.id, edit);

  expect(repository.edit).toHaveBeenCalledWith(skipped, edit);
});

test("returns unchanged sessions without writing", async () => {
  const { repository, service } = createService();
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  const unchanged = {
    title: runSession.title,
    description: runSession.description,
    timeOfDay: runSession.timeOfDay,
    activityType: runSession.activityType,
    targetType: runSession.targetType,
    targetDistanceMetres: runSession.targetDistanceMetres,
    targetDurationSeconds: runSession.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;

  await expect(service.edit(runSession.id, unchanged)).resolves.toBe(
    runSession,
  );
  expect(repository.edit).not.toHaveBeenCalled();
});

test("edits scheduled strength sessions", async () => {
  const { repository, service } = createService();
  const strength: TrainingSession = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SCHEDULED",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 1800,
    actualDurationSeconds: null,
  };
  const edit = {
    title: "Upper-body strength",
    description: "Pull focus",
    timeOfDay: "PM",
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
  } satisfies EditTrainingSessionRequest;
  vi.mocked(repository.findById).mockResolvedValue(strength);
  vi.mocked(repository.edit).mockResolvedValue({ ...strength, ...edit });

  await service.edit(strength.id, edit);

  expect(repository.edit).toHaveBeenCalledWith(strength, edit);
});

test("returns unchanged strength sessions without writing", async () => {
  const { repository, service } = createService();
  const strength: TrainingSession = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SCHEDULED",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 1800,
    actualDurationSeconds: null,
  };
  const edit = {
    title: strength.title,
    description: strength.description,
    timeOfDay: strength.timeOfDay,
    activityType: "STRENGTH",
    targetDurationSeconds: strength.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;
  vi.mocked(repository.findById).mockResolvedValue(strength);

  await expect(service.edit(strength.id, edit)).resolves.toBe(strength);
  expect(repository.edit).not.toHaveBeenCalled();
});

test.each([2400, null])(
  "writes a scheduled strength duration change to %s",
  async (targetDurationSeconds) => {
    const { repository, service } = createService();
    const strength: TrainingSession = {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Strength",
      activityType: "STRENGTH",
      status: "SCHEDULED",
      date: "2026-08-26",
      timeOfDay: null,
      description: null,
      sortOrder: 0,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDurationSeconds: 1800,
      actualDurationSeconds: null,
    };
    const edit = {
      title: strength.title,
      description: strength.description,
      timeOfDay: strength.timeOfDay,
      activityType: "STRENGTH" as const,
      targetDurationSeconds,
    };
    vi.mocked(repository.findById).mockResolvedValue(strength);

    await service.edit(strength.id, edit);

    expect(repository.edit).toHaveBeenCalledWith(strength, edit);
  },
);

test.each([
  {
    targetType: "DISTANCE_PACE" as const,
    targetDistanceMetres: 5000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 300,
    request: {
      targetType: "DISTANCE_PACE" as const,
      targetDistanceMetres: 5000,
      targetPaceSecondsPerKilometre: 300,
    },
  },
  {
    targetType: "DURATION_PACE" as const,
    targetDistanceMetres: null,
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: 300,
    request: {
      targetType: "DURATION_PACE" as const,
      targetDurationSeconds: 1800,
      targetPaceSecondsPerKilometre: 300,
    },
  },
])("detects unchanged $targetType runs", async (targets) => {
  const { repository, service } = createService();
  const current: TrainingSession = { ...runSession, ...targets };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "RUN" as const,
    ...targets.request,
  };
  vi.mocked(repository.findById).mockResolvedValue(current);

  await expect(service.edit(current.id, request)).resolves.toBe(current);
  expect(repository.edit).not.toHaveBeenCalled();
});

test("writes changed duration and pace targets after validation", async () => {
  const durationService = createService();
  const currentDuration = runSession;
  vi.mocked(durationService.repository.findById).mockResolvedValue(
    currentDuration,
  );
  const durationEdit = {
    title: currentDuration.title,
    description: currentDuration.description,
    timeOfDay: currentDuration.timeOfDay,
    activityType: "RUN" as const,
    targetType: "DISTANCE_DURATION" as const,
    targetDistanceMetres: currentDuration.targetDistanceMetres,
    targetDurationSeconds: currentDuration.targetDurationSeconds + 1,
  };
  await durationService.service.edit(currentDuration.id, durationEdit);
  expect(durationService.repository.edit).toHaveBeenCalledWith(
    currentDuration,
    durationEdit,
  );

  const paceService = createService();
  const currentPace: TrainingSession = {
    ...runSession,
    targetType: "DISTANCE_PACE",
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 300,
  };
  vi.mocked(paceService.repository.findById).mockResolvedValue(currentPace);
  const paceEdit = {
    title: currentPace.title,
    description: currentPace.description,
    timeOfDay: currentPace.timeOfDay,
    activityType: "RUN" as const,
    targetType: "DISTANCE_PACE" as const,
    targetDistanceMetres: currentPace.targetDistanceMetres,
    targetPaceSecondsPerKilometre:
      currentPace.targetPaceSecondsPerKilometre + 1,
  };
  await paceService.service.edit(currentPace.id, paceEdit);
  expect(paceService.repository.edit).toHaveBeenCalledWith(
    currentPace,
    paceEdit,
  );
});
