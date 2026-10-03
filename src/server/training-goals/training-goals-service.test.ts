import { DefaultTrainingGoalsService } from "./training-goals-service";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

const request = { title: "Goal", type: "RACE" as const };

test("delegates creation without additional validation", async () => {
  const goal = createTrainingGoal();
  const create = vi.fn().mockResolvedValue(goal);
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create,
    find: vi.fn(),
    findById: vi.fn(),
    edit: vi.fn(),
  });
  await expect(
    service.create(goal.athleteId, goal.athleteId, request),
  ).resolves.toBe(goal);
  expect(create).toHaveBeenCalledExactlyOnceWith({
    ...request,
    athleteId: goal.athleteId,
  });
});

test("forbids another athlete before persistence", async () => {
  const create = vi.fn();
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create,
    find: vi.fn(),
    findById: vi.fn(),
    edit: vi.fn(),
  });
  await expect(service.create("actor", "other", request)).rejects.toThrow(
    ForbiddenError,
  );
  expect(create).not.toHaveBeenCalled();
});

test("propagates repository failure", async () => {
  const error = new Error("Database unavailable");
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create: vi.fn().mockRejectedValue(error),
    find: vi.fn(),
    findById: vi.fn(),
    edit: vi.fn(),
  });
  await expect(service.create("actor", "actor", request)).rejects.toBe(error);
});

test("delegates finding all goals for the authenticated athlete", async () => {
  const goals = [createTrainingGoal()];
  const find = vi.fn().mockResolvedValue(goals);
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create: vi.fn(),
    find,
    findById: vi.fn(),
    edit: vi.fn(),
  });
  await expect(service.find("actor", "actor")).resolves.toBe(goals);
  expect(find).toHaveBeenCalledExactlyOnceWith("actor");
});

test("forbids finding another athlete's goals before querying", async () => {
  const find = vi.fn();
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create: vi.fn(),
    find,
    findById: vi.fn(),
    edit: vi.fn(),
  });
  await expect(service.find("actor", "other")).rejects.toThrow(ForbiddenError);
  expect(find).not.toHaveBeenCalled();
});

test("propagates goal lookup failure", async () => {
  const error = new Error("Database unavailable");
  const service = new DefaultTrainingGoalsService({
    complete: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    edit: vi.fn(),
    find: vi.fn().mockRejectedValue(error),
  });
  await expect(service.find("actor", "actor")).rejects.toBe(error);
});

function setupEdit(goal = createTrainingGoal()) {
  const findById = vi.fn().mockResolvedValue(goal);
  const edit = vi.fn().mockResolvedValue(goal);
  return {
    service: new DefaultTrainingGoalsService({
      complete: vi.fn(),
      findById,
      edit,
      find: vi.fn(),
      create: vi.fn(),
    }),
    findById,
    edit,
    goal,
  };
}

test("edits an owned active goal", async () => {
  const { service, goal, findById, edit } = setupEdit();
  const request = { title: "New title" };
  await expect(service.edit(goal.athleteId, goal.id, request)).resolves.toBe(
    goal,
  );
  expect(findById).toHaveBeenCalledExactlyOnceWith(goal.id);
  expect(edit).toHaveBeenCalledExactlyOnceWith(
    goal.athleteId,
    goal.id,
    request,
  );
});

test("rejects a missing goal before editing", async () => {
  const { service, goal, findById, edit } = setupEdit();
  findById.mockResolvedValue(null);
  await expect(
    service.edit(goal.athleteId, goal.id, { title: "New" }),
  ).rejects.toThrow("Training goal not found");
  expect(edit).not.toHaveBeenCalled();
});

test("checks ownership before goal status", async () => {
  const { service, goal, edit } = setupEdit(
    createTrainingGoal({ status: "COMPLETED" }),
  );
  await expect(
    service.edit("other", goal.id, { title: "New" }),
  ).rejects.toThrow(ForbiddenError);
  expect(edit).not.toHaveBeenCalled();
});

test.each(["COMPLETED", "DISCARDED"] as const)(
  "rejects %s goals",
  async (status) => {
    const { service, goal, edit } = setupEdit(createTrainingGoal({ status }));
    await expect(
      service.edit(goal.athleteId, goal.id, { title: "New" }),
    ).rejects.toThrow("Only active training goals can be edited");
    expect(edit).not.toHaveBeenCalled();
  },
);

test("rejects a goal that changes during editing", async () => {
  const { service, goal, edit } = setupEdit();
  edit.mockResolvedValue(null);
  await expect(
    service.edit(goal.athleteId, goal.id, { title: "New" }),
  ).rejects.toThrow("Only active training goals can be edited");
});

test.each(["lookup", "update"])("propagates %s failures", async (stage) => {
  const { service, goal, findById, edit } = setupEdit();
  const error = new Error("Database unavailable");
  (stage === "lookup" ? findById : edit).mockRejectedValue(error);
  await expect(
    service.edit(goal.athleteId, goal.id, { title: "New" }),
  ).rejects.toBe(error);
});

function setupComplete(goal = createTrainingGoal()) {
  const findById = vi.fn().mockResolvedValue(goal);
  const completed = { ...goal, status: "COMPLETED" as const };
  const complete = vi.fn().mockResolvedValue(completed);
  return {
    service: new DefaultTrainingGoalsService({
      findById,
      complete,
      edit: vi.fn(),
      create: vi.fn(),
      find: vi.fn(),
    }),
    findById,
    complete,
    goal,
    completed,
  };
}

test("completes an owned active goal", async () => {
  const { service, goal, completed, complete, findById } = setupComplete();
  await expect(service.complete(goal.athleteId, goal.id)).resolves.toBe(
    completed,
  );
  expect(findById).toHaveBeenCalledExactlyOnceWith(goal.id);
  expect(complete).toHaveBeenCalledExactlyOnceWith(goal.athleteId, goal.id);
});
test("rejects a missing goal before completion", async () => {
  const { service, goal, complete, findById } = setupComplete();
  findById.mockResolvedValue(null);
  await expect(service.complete(goal.athleteId, goal.id)).rejects.toThrow(
    "Training goal not found",
  );
  expect(complete).not.toHaveBeenCalled();
});
test("checks completion ownership before status", async () => {
  const { service, goal, complete } = setupComplete(
    createTrainingGoal({ status: "COMPLETED" }),
  );
  await expect(service.complete("other", goal.id)).rejects.toThrow(
    ForbiddenError,
  );
  expect(complete).not.toHaveBeenCalled();
});
test.each(["COMPLETED", "DISCARDED"] as const)(
  "rejects completion of %s goals",
  async (status) => {
    const { service, goal, complete } = setupComplete(
      createTrainingGoal({ status }),
    );
    await expect(service.complete(goal.athleteId, goal.id)).rejects.toThrow(
      "Only active training goals can be completed",
    );
    expect(complete).not.toHaveBeenCalled();
  },
);
test("rejects concurrent completion transitions", async () => {
  const { service, goal, complete } = setupComplete();
  complete.mockResolvedValue(null);
  await expect(service.complete(goal.athleteId, goal.id)).rejects.toThrow(
    "Only active training goals can be completed",
  );
});
test.each(["lookup", "update"])(
  "propagates completion %s failures",
  async (stage) => {
    const { service, goal, complete, findById } = setupComplete();
    const error = new Error("Database unavailable");
    (stage === "lookup" ? findById : complete).mockRejectedValue(error);
    await expect(service.complete(goal.athleteId, goal.id)).rejects.toBe(error);
  },
);
