import { DefaultTrainingGoalsService } from "./training-goals-service";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

const request = { title: "Goal", type: "RACE" as const };

test("delegates creation without additional validation", async () => {
  const goal = createTrainingGoal();
  const create = vi.fn().mockResolvedValue(goal);
  const service = new DefaultTrainingGoalsService({ create });
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
  const service = new DefaultTrainingGoalsService({ create });
  await expect(service.create("actor", "other", request)).rejects.toThrow(
    ForbiddenError,
  );
  expect(create).not.toHaveBeenCalled();
});

test("propagates repository failure", async () => {
  const error = new Error("Database unavailable");
  const service = new DefaultTrainingGoalsService({
    create: vi.fn().mockRejectedValue(error),
  });
  await expect(service.create("actor", "actor", request)).rejects.toBe(error);
});
