import { DefaultTrainingGoalsService } from "./training-goals-service";
import type { TrainingGoalsStore } from "./training-goals-repository";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

const request = {
  title: "Goal",
  purpose: "Fitness",
  trainingIntentions: "Run regularly",
  startDate: "2026-10-02",
  targetDate: "2026-12-01",
};
const goal = createTrainingGoal();

function setup(current = goal) {
  const store = {
    create: vi.fn().mockResolvedValue(goal),
    edit: vi.fn().mockResolvedValue(goal),
    complete: vi.fn().mockResolvedValue(goal),
    discard: vi.fn().mockResolvedValue(goal),
    findById: vi.fn().mockResolvedValue(current),
    find: vi.fn(),
    findUnresolved: vi.fn().mockResolvedValue([current]),
  };
  const lock = vi.fn();
  const repository = {
    create: vi.fn(),
    edit: vi.fn(),
    complete: vi.fn(),
    discard: vi.fn(),
    findById: vi.fn(),
    find: vi.fn().mockResolvedValue([goal]),
    findUnresolved: vi.fn(),
    withAthleteLock: async <T>(
      athleteId: string,
      action: (repository: TrainingGoalsStore) => Promise<T>,
    ): Promise<T> => {
      await lock(athleteId, action);
      return action(store);
    },
  };
  const fields = { ...request, title: "Validated" };
  const validator = {
    validateCreate: vi.fn().mockReturnValue(fields),
    validateEdit: vi.fn().mockReturnValue(fields),
  };
  return {
    service: new DefaultTrainingGoalsService(repository, validator),
    repository,
    lock,
    store,
    validator,
    fields,
  };
}

test("retrieves outstanding goals, validates, and creates using the locked repository", async () => {
  const s = setup();
  await expect(
    s.service.create(goal.athleteId, goal.athleteId, request),
  ).resolves.toBe(goal);
  expect(s.lock).toHaveBeenCalledWith(goal.athleteId, expect.any(Function));
  expect(s.store.findUnresolved).toHaveBeenCalledExactlyOnceWith(
    goal.athleteId,
  );
  expect(s.validator.validateCreate).toHaveBeenCalledExactlyOnceWith(request, [
    goal,
  ]);
  expect(s.store.findUnresolved.mock.invocationCallOrder[0]).toBeLessThan(
    s.validator.validateCreate.mock.invocationCallOrder[0],
  );
  expect(s.validator.validateCreate.mock.invocationCallOrder[0]).toBeLessThan(
    s.store.create.mock.invocationCallOrder[0],
  );
  expect(s.store.create).toHaveBeenCalledExactlyOnceWith({
    ...s.fields,
    athleteId: goal.athleteId,
  });
  expect(s.repository.create).not.toHaveBeenCalled();
  expect(s.repository.findUnresolved).not.toHaveBeenCalled();
});

test("rejects another athlete's creation before locking, reading, or validating", async () => {
  const s = setup();
  await expect(
    s.service.create("other", goal.athleteId, request),
  ).rejects.toThrow(ForbiddenError);
  expect(s.lock).not.toHaveBeenCalled();
  expect(s.store.findUnresolved).not.toHaveBeenCalled();
  expect(s.validator.validateCreate).not.toHaveBeenCalled();
});

test("validation failure prevents creation", async () => {
  const s = setup();
  const error = new TrainingGoalOverlapError();
  s.validator.validateCreate.mockImplementation(() => {
    throw error;
  });
  await expect(
    s.service.create(goal.athleteId, goal.athleteId, request),
  ).rejects.toBe(error);
  expect(s.store.create).not.toHaveBeenCalled();
});

test.each(["findUnresolved", "create"] as const)(
  "propagates creation %s failure",
  async (operation) => {
    const s = setup();
    const error = new Error("Database unavailable");
    s.store[operation].mockRejectedValue(error);
    await expect(
      s.service.create(goal.athleteId, goal.athleteId, request),
    ).rejects.toBe(error);
    if (operation === "findUnresolved") {
      expect(s.validator.validateCreate).not.toHaveBeenCalled();
      expect(s.store.create).not.toHaveBeenCalled();
    }
  },
);

test("propagates transaction failure", async () => {
  const s = setup();
  const error = new Error("Lock failed");
  s.lock.mockRejectedValue(error);
  await expect(
    s.service.create(goal.athleteId, goal.athleteId, request),
  ).rejects.toBe(error);
  expect(s.store.findUnresolved).not.toHaveBeenCalled();
});

test("retrieves the latest goal and outstanding goals before validating and editing", async () => {
  const s = setup();
  const edit = { title: "Updated" };
  await expect(s.service.edit(goal.athleteId, goal.id, edit)).resolves.toBe(
    goal,
  );
  expect(s.store.findById).toHaveBeenCalledExactlyOnceWith(goal.id);
  expect(s.store.findUnresolved).toHaveBeenCalledExactlyOnceWith(
    goal.athleteId,
  );
  expect(s.validator.validateEdit).toHaveBeenCalledExactlyOnceWith(goal, edit, [
    goal,
  ]);
  expect(s.store.findById.mock.invocationCallOrder[0]).toBeLessThan(
    s.store.findUnresolved.mock.invocationCallOrder[0],
  );
  expect(s.store.findUnresolved.mock.invocationCallOrder[0]).toBeLessThan(
    s.validator.validateEdit.mock.invocationCallOrder[0],
  );
  expect(s.validator.validateEdit.mock.invocationCallOrder[0]).toBeLessThan(
    s.store.edit.mock.invocationCallOrder[0],
  );
  expect(s.store.edit).toHaveBeenCalledExactlyOnceWith(
    goal.athleteId,
    goal.id,
    s.fields,
  );
  expect(s.repository.findById).not.toHaveBeenCalled();
  expect(s.repository.edit).not.toHaveBeenCalled();
});

test("validation failure prevents editing", async () => {
  const s = setup();
  const error = new TrainingGoalOverlapError();
  s.validator.validateEdit.mockImplementation(() => {
    throw error;
  });
  await expect(
    s.service.edit(goal.athleteId, goal.id, { targetDate: "2027-01-01" }),
  ).rejects.toBe(error);
  expect(s.store.edit).not.toHaveBeenCalled();
});

test("outstanding-goal lookup failure prevents edit validation and persistence", async () => {
  const s = setup();
  const error = new Error("Lookup failed");
  s.store.findUnresolved.mockRejectedValue(error);
  await expect(
    s.service.edit(goal.athleteId, goal.id, { title: "New" }),
  ).rejects.toBe(error);
  expect(s.validator.validateEdit).not.toHaveBeenCalled();
  expect(s.store.edit).not.toHaveBeenCalled();
});

describe.each(["edit", "complete", "discard"] as const)(
  "%s lifecycle",
  (operation) => {
    function invoke(
      service: DefaultTrainingGoalsService,
      actorId = goal.athleteId,
    ) {
      return operation === "edit"
        ? service.edit(actorId, goal.id, { title: "New" })
        : service[operation](actorId, goal.id);
    }

    test("uses the athlete lock and transaction-bound read/write operations", async () => {
      const s = setup();
      await expect(invoke(s.service)).resolves.toBe(goal);
      expect(s.lock).toHaveBeenCalledWith(goal.athleteId, expect.any(Function));
      expect(s.store.findById).toHaveBeenCalledExactlyOnceWith(goal.id);
      expect(s.store[operation]).toHaveBeenCalledOnce();
      expect(s.repository[operation]).not.toHaveBeenCalled();
    });

    test("rejects missing goals before writing", async () => {
      const s = setup();
      s.store.findById.mockResolvedValue(null);
      await expect(invoke(s.service)).rejects.toThrow(
        "Training goal not found",
      );
      expect(s.store[operation]).not.toHaveBeenCalled();
      expect(s.store.findUnresolved).not.toHaveBeenCalled();
    });

    test("checks ownership before resolution", async () => {
      const s = setup(
        createTrainingGoal({
          resolution: "completed",
          resolvedAt: "2026-11-25T12:00:00Z",
        }),
      );
      await expect(invoke(s.service, "other")).rejects.toThrow(ForbiddenError);
      expect(s.store[operation]).not.toHaveBeenCalled();
      expect(s.store.findUnresolved).not.toHaveBeenCalled();
    });

    test.each(["completed", "discarded"] as const)(
      "rejects %s goals",
      async (resolution) => {
        const s = setup(
          createTrainingGoal({
            resolution,
            resolvedAt: "2026-11-25T12:00:00Z",
          }),
        );
        await expect(invoke(s.service)).rejects.toThrow(
          "Only unresolved training goals",
        );
        expect(s.store[operation]).not.toHaveBeenCalled();
        expect(s.store.findUnresolved).not.toHaveBeenCalled();
        expect(s.validator.validateEdit).not.toHaveBeenCalled();
      },
    );

    test("rejects a conditional write which no longer matches", async () => {
      const s = setup();
      s.store[operation].mockResolvedValue(null);
      await expect(invoke(s.service)).rejects.toThrow(
        "Only unresolved training goals",
      );
    });

    test.each(["read", "write"])("propagates %s failures", async (stage) => {
      const s = setup();
      const error = new Error("Database unavailable");
      (stage === "read"
        ? s.store.findById
        : s.store[operation]
      ).mockRejectedValue(error);
      await expect(invoke(s.service)).rejects.toBe(error);
    });

    test.each([
      { startDate: "2000-01-01", targetDate: "2000-02-01" },
      { startDate: "2099-01-01", targetDate: "2099-02-01" },
    ])("allows unresolved goals outside their period %j", async (dates) => {
      const s = setup(createTrainingGoal(dates));
      await expect(invoke(s.service)).resolves.toBe(goal);
    });
  },
);

test("lists goals for the authenticated athlete without opening a transaction", async () => {
  const s = setup();
  await expect(s.service.find(goal.athleteId, goal.athleteId)).resolves.toEqual(
    [goal],
  );
  expect(s.repository.find).toHaveBeenCalledExactlyOnceWith(goal.athleteId);
  expect(s.lock).not.toHaveBeenCalled();
});

test("rejects listing another athlete's goals", async () => {
  const s = setup();
  await expect(s.service.find("other", goal.athleteId)).rejects.toThrow(
    ForbiddenError,
  );
  expect(s.repository.find).not.toHaveBeenCalled();
});

test("propagates listing failure", async () => {
  const s = setup();
  const error = new Error("Lookup failed");
  s.repository.find.mockRejectedValue(error);
  await expect(s.service.find(goal.athleteId, goal.athleteId)).rejects.toBe(
    error,
  );
});
