import { DefaultTrainingSessionsRequestValidator } from "./training-sessions-request-validator";
import { createRunActivity } from "@/test-support/fixtures/activity";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import { TrainingSessionsRequestValidationError } from "./training-sessions-errors";
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

  const requestValidator = new DefaultTrainingSessionsRequestValidator();
  vi.spyOn(requestValidator, "validateCreate");
  vi.spyOn(requestValidator, "validateEdit");
  vi.spyOn(requestValidator, "validateSkip");
  vi.spyOn(requestValidator, "validateComplete");

  return {
    requestValidator,
    repository,
    validator,
    userService,
    service: new DefaultTrainingSessionsService(
      repository,
      validator,
      userService,
      requestValidator,
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

test("rejects creation for another athlete before validating input or looking up users", async () => {
  const { service, repository, userService, requestValidator } =
    createService();
  const body = null;

  await expect(service.create("other-actor", actorId, body)).rejects.toThrow(
    ForbiddenError,
  );
  for (const method of [
    "validateCreate",
    "validateEdit",
    "validateSkip",
    "validateComplete",
  ] as const) {
    expect(requestValidator[method]).not.toHaveBeenCalled();
  }
  expect(userService.findById).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each(["findById", "delete", "edit", "complete", "skip"] as const)(
  "%s rejects another athlete before request or domain validation or writing",
  async (operation) => {
    const { service, repository, validator, requestValidator } =
      createService();
    const body = null;
    const foreignActor = "other-actor";
    const operations = {
      findById: () => service.findById(foreignActor, runSession.id),
      delete: () => service.delete(foreignActor, runSession.id),
      edit: () => service.edit(foreignActor, runSession.id, body),
      complete: () =>
        service.complete(foreignActor, runSession.id, body, timeZone),
      skip: () => service.skip(foreignActor, runSession.id, body, timeZone),
    };

    await expect(operations[operation]()).rejects.toThrow(ForbiddenError);
    expect(repository.findById).toHaveBeenCalledExactlyOnceWith(runSession.id);
    for (const method of [
      "validateCreate",
      "validateEdit",
      "validateSkip",
      "validateComplete",
    ] as const) {
      expect(requestValidator[method]).not.toHaveBeenCalled();
    }
    expect(validator.validateEdit).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.skip).not.toHaveBeenCalled();
    expect(repository.deleteById).not.toHaveBeenCalled();
  },
);

test.each([
  ["create", "validateCreate"],
  ["edit", "validateEdit"],
  ["complete", "validateComplete"],
  ["skip", "validateSkip"],
] as const)(
  "%s propagates request validation failure without writing",
  async (operation, validateMethod) => {
    const { service, repository, validator, requestValidator } =
      createService();
    const failure = new TrainingSessionsRequestValidationError({
      body: ["input rejected"],
    });
    const body = null;
    vi.mocked(requestValidator[validateMethod]).mockImplementation(() => {
      throw failure;
    });
    const operations = {
      create: () => service.create(actorId, actorId, body),
      edit: () => service.edit(actorId, runSession.id, body),
      complete: () => service.complete(actorId, runSession.id, body, timeZone),
      skip: () => service.skip(actorId, runSession.id, body, timeZone),
    };

    await expect(operations[operation]()).rejects.toBe(failure);
    expect(requestValidator[validateMethod]).toHaveBeenCalledExactlyOnceWith(
      body,
    );
    expect(validator.validateEdit).not.toHaveBeenCalled();
    expect(validator.validateSkip).not.toHaveBeenCalled();
    expect(validator.validateComplete).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.edit).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
    expect(repository.skip).not.toHaveBeenCalled();
  },
);

test.each([
  ["create", "validateCreate"],
  ["edit", "validateEdit"],
  ["skip", "validateSkip"],
  ["complete", "validateComplete"],
] as const)(
  "%s uses the injected validator's output exactly once",
  async (operation, validateMethod) => {
    const { service, repository, validator, requestValidator } =
      createService();
    const request = {
      activityType: runSession.activityType,
      date: runSession.date,
      timeOfDay: runSession.timeOfDay,
      targetDistanceMetres: runSession.targetDistanceMetres,
      targetDurationSeconds: runSession.targetDurationSeconds,
    };
    const bodies = {
      create: {
        ...request,
        title: "  Easy run  ",
        description: "  Relax  ",
        date: runSession.date,
      },
      edit: { ...request, title: "  Easy run  ", description: "  Relax  " },
      skip: { skipReason: "  Recovery  " },
      complete: { actualDurationSeconds: 1500, actualDistanceMetres: 5000 },
    };
    const body = bodies[operation];
    vi.mocked(repository[operation]).mockResolvedValue(runSession);

    const operations = {
      create: () => service.create(actorId, actorId, body),
      edit: () => service.edit(actorId, runSession.id, body),
      skip: () => service.skip(actorId, runSession.id, body, timeZone),
      complete: () => service.complete(actorId, runSession.id, body, timeZone),
    };
    await expect(operations[operation]()).resolves.toBe(runSession);

    expect(requestValidator[validateMethod]).toHaveBeenCalledExactlyOnceWith(
      body,
    );
    const validated = vi.mocked(requestValidator[validateMethod]).mock
      .results[0].value;
    if (operation === "create") {
      expect(repository.create).toHaveBeenCalledExactlyOnceWith({
        ...validated,
        athleteId: actorId,
      });
    } else {
      expect(repository[operation]).toHaveBeenCalledExactlyOnceWith(
        runSession,
        validated,
      );
      expect(vi.mocked(repository[operation]).mock.calls[0][1]).toBe(validated);
    }
    if (operation === "create" || operation === "edit") {
      expect(validated).toMatchObject({
        title: "Easy run",
        description: "Relax",
      });
    }
    if (operation === "skip")
      expect(validated).toEqual({ skipReason: "Recovery" });
    if (operation === "edit")
      expect(validator.validateEdit).toHaveBeenCalledExactlyOnceWith(
        runSession,
        validated,
      );
    if (operation === "complete")
      expect(validator.validateComplete).toHaveBeenCalledExactlyOnceWith(
        runSession,
        validated,
        timeZone,
      );
  },
);
