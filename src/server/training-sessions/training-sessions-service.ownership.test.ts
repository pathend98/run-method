import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

const runSession = createRunTrainingSession();
const actorId = runSession.athleteId;
const timeZone = "UTC";

function createService() {
  const repository: TrainingSessionsRepository = {
    find: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(createRunTrainingSession()),
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

test("rejects another athlete's list before querying", async () => {
  const { service, repository } = createService();

  await expect(
    service.find("other-actor", { athleteId: actorId, from: "2026-08-17" }),
  ).rejects.toThrow(ForbiddenError);
  expect(repository.find).not.toHaveBeenCalled();
});

test("rejects an unscoped list without querying the repository", async () => {
  const { service, repository } = createService();

  await expect(
    service.find(actorId, {} as Parameters<typeof service.find>[1]),
  ).rejects.toThrow(ForbiddenError);
  expect(repository.find).not.toHaveBeenCalled();
});

test("rejects creation for another athlete before looking up users or writing", async () => {
  const { service, repository, userService } = createService();
  const body = {
    activityType: "RUN" as const,
    title: runSession.title,
    description: runSession.description,
    timeOfDay: runSession.timeOfDay,
    date: runSession.date,
    targetDistanceMetres: runSession.targetDistanceMetres,
    targetDurationSeconds: runSession.targetDurationSeconds,
  };

  await expect(service.create("other-actor", actorId, body)).rejects.toThrow(
    ForbiddenError,
  );

  expect(userService.findById).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each(["findById", "delete", "edit", "complete", "skip"] as const)(
  "%s rejects another athlete before domain validation or writing",
  async (operation) => {
    const { service, repository, validator } = createService();
    const body = {
      activityType: "RUN" as const,
      title: runSession.title,
      description: runSession.description,
      timeOfDay: runSession.timeOfDay,
      date: runSession.date,
      targetDistanceMetres: runSession.targetDistanceMetres,
      targetDurationSeconds: runSession.targetDurationSeconds,
    };
    const foreignActor = "other-actor";
    const operations = {
      findById: () => service.findById(foreignActor, runSession.id),
      delete: () => service.delete(foreignActor, runSession.id),
      edit: () => service.edit(foreignActor, runSession.id, body),
      complete: () =>
        service.complete(
          foreignActor,
          runSession.id,
          { actualDurationSeconds: 1500, actualDistanceMetres: 5000 },
          timeZone,
        ),
      skip: () =>
        service.skip(
          foreignActor,
          runSession.id,
          { skipReason: "Recovery" },
          timeZone,
        ),
    };

    await expect(operations[operation]()).rejects.toThrow(ForbiddenError);
    expect(repository.findById).toHaveBeenCalledExactlyOnceWith(runSession.id);

    expect(validator.validateEdit).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.skip).not.toHaveBeenCalled();
    expect(repository.deleteById).not.toHaveBeenCalled();
  },
);
