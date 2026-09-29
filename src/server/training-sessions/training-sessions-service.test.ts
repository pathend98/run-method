import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type {
  EditTrainingSessionRequest,
  StrengthTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

const timeZone = "UTC";

function createService() {
  const repository: TrainingSessionsRepository = {
    find: vi.fn().mockResolvedValue([]),
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
  const userService: Pick<UserService, "findById"> = {
    findById: vi.fn(),
  };

  return {
    repository,
    validator,
    userService,
    service: new DefaultTrainingSessionsService(
      repository,
      validator,
      userService,
    ),
  };
}

test("rejects invalid date strings", async () => {
  const { service } = createService();

  await expect(service.find({ from: "2026-02-30" })).rejects.toThrow(
    "from and to must be valid dates in YYYY-MM-DD format when provided",
  );
});

test("rejects inverted date ranges", async () => {
  const { service } = createService();

  await expect(
    service.find({ from: "2026-08-24", to: "2026-08-23" }),
  ).rejects.toThrow("from must be before or equal to to");
});

test("delegates bounded, unbounded, status, and unrestricted queries to the repository", async () => {
  const { repository, service } = createService();

  await expect(
    service.find({ from: "2026-08-17", to: "2026-09-30" }),
  ).resolves.toEqual([]);
  await service.find({ from: "2026-08-17" });
  await service.find({ to: "2026-08-23" });
  await service.find({ status: "SCHEDULED" });
  await service.find({});

  expect(repository.find).toHaveBeenNthCalledWith(1, {
    from: "2026-08-17",
    to: "2026-09-30",
  });
  expect(repository.find).toHaveBeenNthCalledWith(2, { from: "2026-08-17" });
  expect(repository.find).toHaveBeenNthCalledWith(3, { to: "2026-08-23" });
  expect(repository.find).toHaveBeenNthCalledWith(4, { status: "SCHEDULED" });
  expect(repository.find).toHaveBeenNthCalledWith(5, {});
});

test("rejects invalid statuses", async () => {
  const { service } = createService();

  await expect(service.find({ status: "DUE" })).rejects.toThrow(
    "status must be SCHEDULED, COMPLETED, or SKIPPED",
  );
});

test("validates athlete ids and forwards valid athlete filters", async () => {
  const { repository, service } = createService();
  await expect(service.find({ athleteId: "invalid" })).rejects.toThrow(
    "athlete id must be a valid UUID",
  );
  expect(repository.find).not.toHaveBeenCalled();

  const athleteId = "33333333-3333-4333-8333-333333333333";
  await service.find({ status: "SCHEDULED", athleteId });
  expect(repository.find).toHaveBeenCalledWith({
    status: "SCHEDULED",
    athleteId,
  });
});

test("delegates creation to the repository", async () => {
  const { repository, service, userService } = createService();
  const request = {
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: "Strength",
    activityType: "STRENGTH" as const,
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: 1800,
  };
  const created = createStrengthActivity({
    date: request.date,
    targetDurationSeconds: request.targetDurationSeconds,
    createdAt: "2026-08-26T10:00:00.000Z",
    updatedAt: "2026-08-26T10:00:00.000Z",
  });
  vi.mocked(repository.create).mockResolvedValue(created);

  await expect(service.create(request)).resolves.toEqual(created);
  expect(userService.findById).toHaveBeenCalledWith(request.athleteId);
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
    service.skip(runSession.id, { skipReason: "Recovery" }, timeZone),
  ).resolves.toBe(skipped);
  expect(validator.validateSkip).toHaveBeenCalledWith(runSession, timeZone);
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

  await expect(
    service.complete(runSession.id, request, timeZone),
  ).resolves.toBe(completed);
  expect(validator.validateComplete).toHaveBeenCalledWith(
    runSession,
    request,
    timeZone,
  );
  expect(repository.complete).toHaveBeenCalledWith(runSession, request);
});

test.each(["skip", "complete"] as const)(
  "validates %s ids before loading a session",
  async (operation) => {
    const { repository, service } = createService();

    const result =
      operation === "skip"
        ? service.skip("invalid", { skipReason: "Recovery" }, timeZone)
        : service.complete(
            "invalid",
            { actualDurationSeconds: 1500 },
            timeZone,
          );

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
        ? service.skip(runSession.id, { skipReason: "Recovery" }, timeZone)
        : service.complete(
            runSession.id,
            { actualDurationSeconds: 1500 },
            timeZone,
          );

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
        ? service.skip(runSession.id, { skipReason: "Recovery" }, timeZone)
        : service.complete(
            runSession.id,
            {
              actualDurationSeconds: 1500,
              actualDistanceMetres: 5000,
            },
            timeZone,
          );

    await expect(result).rejects.toThrow(
      "training session is no longer scheduled",
    );
  },
);

const runSession: TrainingSession = createRunActivity({
  title: "Easy run",
  date: "2026-08-26",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
});

const runEdit: EditTrainingSessionRequest = {
  title: "Long easy run",
  description: "Keep it relaxed",
  timeOfDay: "PM",
  activityType: "RUN",
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
    targetDistanceMetres: runSession.targetDistanceMetres,
    targetDurationSeconds: runSession.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;

  await expect(service.edit(runSession.id, unchanged)).resolves.toBe(
    runSession,
  );
  expect(repository.edit).not.toHaveBeenCalled();
});

test("treats a supplied current date as unchanged", async () => {
  const { repository, service } = createService();
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  const request = {
    title: runSession.title,
    description: runSession.description,
    date: runSession.date,
    timeOfDay: runSession.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: runSession.targetDistanceMetres,
    targetDurationSeconds: runSession.targetDurationSeconds,
  };

  await expect(service.edit(runSession.id, request)).resolves.toBe(runSession);
  expect(repository.edit).not.toHaveBeenCalled();
});

test("writes a scheduled date change", async () => {
  const { repository, service } = createService();
  const request = { ...runEdit, date: "2026-08-27" };
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(repository.edit).mockResolvedValue({ ...runSession, ...request });

  await service.edit(runSession.id, request);

  expect(repository.edit).toHaveBeenCalledWith(runSession, request);
});

test("reports a concurrent transition during a scheduled date change", async () => {
  const { repository, service } = createService();
  vi.mocked(repository.findById).mockResolvedValue(runSession);
  vi.mocked(repository.edit).mockResolvedValue(null);

  await expect(
    service.edit(runSession.id, { ...runEdit, date: "2026-08-27" }),
  ).rejects.toThrow("training session is no longer scheduled");
});

test("writes changed completed run actuals", async () => {
  const { repository, service } = createService();
  const completed = {
    ...runSession,
    status: "COMPLETED" as const,
    actualDistanceMetres: 5000,
    actualDurationSeconds: 1500,
  };
  const edit = {
    title: completed.title,
    description: completed.description,
    timeOfDay: completed.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: completed.targetDistanceMetres,
    targetDurationSeconds: completed.targetDurationSeconds,
    actualDistanceMetres: 5100,
    actualDurationSeconds: 1530,
  };
  vi.mocked(repository.findById).mockResolvedValue(completed);
  vi.mocked(repository.edit).mockResolvedValue({ ...completed, ...edit });

  await service.edit(completed.id, edit);

  expect(repository.edit).toHaveBeenCalledWith(completed, edit);
});

test("does not write unchanged completed actuals", async () => {
  const { repository, service } = createService();
  const completed = {
    ...runSession,
    status: "COMPLETED" as const,
    actualDistanceMetres: 5000,
    actualDurationSeconds: 1500,
  };
  const edit = {
    title: completed.title,
    description: completed.description,
    timeOfDay: completed.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: completed.targetDistanceMetres,
    targetDurationSeconds: completed.targetDurationSeconds,
    actualDistanceMetres: completed.actualDistanceMetres,
    actualDurationSeconds: completed.actualDurationSeconds,
  };
  vi.mocked(repository.findById).mockResolvedValue(completed);

  await expect(service.edit(completed.id, edit)).resolves.toBe(completed);
  expect(repository.edit).not.toHaveBeenCalled();
});

test("does not write an unchanged completed strength actual duration", async () => {
  const { repository, service } = createService();
  const completed: StrengthTrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    status: "COMPLETED",
    date: "2026-08-26",
    timeOfDay: null,
    targetDurationSeconds: 1800,
    actualDurationSeconds: 1750,
  });
  const edit = {
    title: completed.title,
    description: completed.description,
    timeOfDay: completed.timeOfDay,
    activityType: "STRENGTH" as const,
    targetDurationSeconds: completed.targetDurationSeconds,
    actualDurationSeconds: 1750,
  };
  vi.mocked(repository.findById).mockResolvedValue(completed);

  await expect(service.edit(completed.id, edit)).resolves.toBe(completed);
  expect(repository.edit).not.toHaveBeenCalled();
});

test("edits scheduled strength sessions", async () => {
  const { repository, service } = createService();
  const strength: TrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-08-26",
    timeOfDay: null,
    targetDurationSeconds: 1800,
  });
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
  const strength: TrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-08-26",
    timeOfDay: null,
    targetDurationSeconds: 1800,
  });
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
    const strength: TrainingSession = createStrengthActivity({
      id: "22222222-2222-4222-8222-222222222222",
      date: "2026-08-26",
      timeOfDay: null,
      targetDurationSeconds: 1800,
    });
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

test("detects unchanged canonical run targets", async () => {
  const { repository, service } = createService();
  const current = runSession;
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
  };
  vi.mocked(repository.findById).mockResolvedValue(current);

  await expect(service.edit(current.id, request)).resolves.toBe(current);
  expect(repository.edit).not.toHaveBeenCalled();
});

test("writes changed canonical targets after validation", async () => {
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
    targetDistanceMetres: currentDuration.targetDistanceMetres,
    targetDurationSeconds: currentDuration.targetDurationSeconds + 1,
  };
  await durationService.service.edit(currentDuration.id, durationEdit);
  expect(durationService.repository.edit).toHaveBeenCalledWith(
    currentDuration,
    durationEdit,
  );

  const distanceService = createService();
  const distanceEdit = {
    title: currentDuration.title,
    description: currentDuration.description,
    timeOfDay: currentDuration.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: currentDuration.targetDistanceMetres + 1,
    targetDurationSeconds: currentDuration.targetDurationSeconds,
  };
  vi.mocked(distanceService.repository.findById).mockResolvedValue(
    currentDuration,
  );
  await distanceService.service.edit(currentDuration.id, distanceEdit);
  expect(distanceService.repository.edit).toHaveBeenCalledWith(
    currentDuration,
    distanceEdit,
  );
});
