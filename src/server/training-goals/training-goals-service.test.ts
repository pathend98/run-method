import { DefaultTrainingGoalsService } from "./training-goals-service";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

const request = { title: "Goal", type: "RACE" as const };

test("delegates creation without additional validation", async () => {
  const goal = createTrainingGoal();
  const create = vi.fn().mockResolvedValue(goal);
  const service = new DefaultTrainingGoalsService({ create, find: vi.fn() });
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
  const service = new DefaultTrainingGoalsService({ create, find: vi.fn() });
  await expect(service.create("actor", "other", request)).rejects.toThrow(
    ForbiddenError,
  );
  expect(create).not.toHaveBeenCalled();
});

test("propagates repository failure", async () => {
  const error = new Error("Database unavailable");
  const service = new DefaultTrainingGoalsService({
    create: vi.fn().mockRejectedValue(error),
    find: vi.fn(),
  });
  await expect(service.create("actor", "actor", request)).rejects.toBe(error);
});

test("delegates finding all goals for the authenticated athlete", async () => {
  const goals = [createTrainingGoal()];
  const find = vi.fn().mockResolvedValue(goals);
  const service = new DefaultTrainingGoalsService({ create: vi.fn(), find });
  await expect(service.find("actor", "actor")).resolves.toBe(goals);
  expect(find).toHaveBeenCalledExactlyOnceWith("actor");
});

test("forbids finding another athlete's goals before querying", async () => {
  const find = vi.fn();
  const service = new DefaultTrainingGoalsService({ create: vi.fn(), find });
  await expect(service.find("actor", "other")).rejects.toThrow(ForbiddenError);
  expect(find).not.toHaveBeenCalled();
});

test("propagates goal lookup failure", async () => {
  const error = new Error("Database unavailable");
  const service = new DefaultTrainingGoalsService({
    create: vi.fn(),
    find: vi.fn().mockRejectedValue(error),
  });
  await expect(service.find("actor", "actor")).rejects.toBe(error);
});
