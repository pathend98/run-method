import { trainingGoals } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { DrizzleTrainingGoalsRepository } from "./training-goals-repository";

function setup(row: typeof trainingGoals.$inferSelect) {
  const returning = vi.fn().mockResolvedValue([row]);
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });
  const transform = vi.fn().mockReturnValue(goal);
  return {
    repository: new DrizzleTrainingGoalsRepository({ insert } as never, {
      transform,
    }),
    transform,
    returning,
    values,
    insert,
  };
}

const goal = createTrainingGoal();
const row: typeof trainingGoals.$inferSelect = {
  ...goal,
  createdAt: new Date(goal.createdAt),
  targetDistanceMetres: null,
  targetTimeSeconds: null,
  targetDate: null,
  description: null,
};

test("delegates the returned row to the transformer", async () => {
  const { repository, insert, values, returning, transform } = setup(row);
  const request = {
    athleteId: goal.athleteId,
    title: goal.title,
    type: goal.type,
  };
  await expect(repository.create(request)).resolves.toBe(goal);
  expect(transform).toHaveBeenCalledExactlyOnceWith(row);
  expect(insert).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(values).toHaveBeenCalledExactlyOnceWith(request);
  expect(returning).toHaveBeenCalledExactlyOnceWith();
});

test("persists all supplied optional values", async () => {
  const targets = {
    targetDistanceMetres: 42195,
    targetTimeSeconds: 14400,
    targetDate: "2027-04-01",
    description: "Marathon",
  };
  const { repository, values } = setup({ ...row, ...targets });
  const request = {
    athleteId: goal.athleteId,
    title: goal.title,
    type: goal.type,
    ...targets,
  };
  await expect(repository.create(request)).resolves.toBe(goal);
  expect(values).toHaveBeenCalledExactlyOnceWith(request);
});

test("propagates persistence failure", async () => {
  const { repository, returning, transform } = setup(row);
  const error = new Error("Database unavailable");
  returning.mockRejectedValue(error);
  await expect(
    repository.create({
      athleteId: goal.athleteId,
      title: goal.title,
      type: goal.type,
    }),
  ).rejects.toBe(error);
  expect(transform).not.toHaveBeenCalled();
});

test("propagates transformer failure", async () => {
  const { repository, transform } = setup(row);
  const error = new Error("Transformation failed");
  transform.mockImplementation(() => {
    throw error;
  });
  await expect(
    repository.create({
      athleteId: goal.athleteId,
      title: goal.title,
      type: goal.type,
    }),
  ).rejects.toBe(error);
});
