import { createRunActivity } from "@/test-support/fixtures/activity";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import { TrainingSessionsValidationError } from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

const runSession = createRunActivity();
const actorId = runSession.athleteId;
const timeZone = "UTC";

function createService() {
  const repository: TrainingSessionsRepository = {
    find: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(createRunActivity()),
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

test("rejects another athlete's list before validating filters or querying", async () => {
  const { service, repository } = createService();

  await expect(
    service.find("other-actor", { athleteId: actorId, from: "invalid" }),
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

test("rejects creation for another athlete before reading input or looking up users", async () => {
  const { service, repository, userService } = createService();
  const readRequest = vi.fn(() => {
    throw new Error("invalid input");
  });

  await expect(
    service.create("other-actor", actorId, readRequest),
  ).rejects.toThrow(ForbiddenError);
  expect(readRequest).not.toHaveBeenCalled();
  expect(userService.findById).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each(["findById", "delete", "edit", "complete", "skip"] as const)(
  "%s rejects another athlete before reading input, validating or writing",
  async (operation) => {
    const { service, repository, validator } = createService();
    const readRequest = vi.fn(() => {
      throw new Error("invalid input");
    });
    const foreignActor = "other-actor";
    const operations = {
      findById: () => service.findById(foreignActor, runSession.id),
      delete: () => service.delete(foreignActor, runSession.id),
      edit: () => service.edit(foreignActor, runSession.id, readRequest),
      complete: () =>
        service.complete(foreignActor, runSession.id, readRequest, timeZone),
      skip: () =>
        service.skip(foreignActor, runSession.id, readRequest, timeZone),
    };

    await expect(operations[operation]()).rejects.toThrow(ForbiddenError);
    expect(repository.findById).toHaveBeenCalledExactlyOnceWith(runSession.id);
    expect(readRequest).not.toHaveBeenCalled();
    expect(validator.validateEdit).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.skip).not.toHaveBeenCalled();
    expect(repository.deleteById).not.toHaveBeenCalled();
  },
);

test.each(["create", "edit", "complete", "skip"] as const)(
  "%s propagates deferred input failure without writing",
  async (operation) => {
    const { service, repository } = createService();
    const failure = new TrainingSessionsValidationError("input rejected");
    const readRequest = vi.fn().mockRejectedValue(failure);
    const operations = {
      create: () => service.create(actorId, actorId, readRequest),
      edit: () => service.edit(actorId, runSession.id, readRequest),
      complete: () =>
        service.complete(actorId, runSession.id, readRequest, timeZone),
      skip: () => service.skip(actorId, runSession.id, readRequest, timeZone),
    };

    await expect(operations[operation]()).rejects.toBe(failure);
    expect(readRequest).toHaveBeenCalledExactlyOnceWith();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.skip).not.toHaveBeenCalled();
  },
);
