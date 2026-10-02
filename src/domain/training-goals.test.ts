import {
  createTrainingGoalRequestSchema,
  trainingGoalSchema,
  trainingGoalStatusSchema,
} from "./training-goals";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

test.each(["RACE", "DISTANCE", "CONSISTENCY", "OPEN"])(
  "accepts %s without targets",
  (type) => {
    expect(
      createTrainingGoalRequestSchema.parse({ title: " Goal ", type }),
    ).toEqual({ title: "Goal", type });
  },
);

test("accepts all optional fields and a past target date without business validation", () => {
  expect(
    createTrainingGoalRequestSchema.parse({
      title: " Goal ",
      type: "OPEN",
      targetDistanceMetres: 5000,
      targetTimeSeconds: 1200,
      targetDate: "2000-01-01",
      description: " Details ",
    }),
  ).toEqual({
    title: "Goal",
    type: "OPEN",
    targetDistanceMetres: 5000,
    targetTimeSeconds: 1200,
    targetDate: "2000-01-01",
    description: "Details",
  });
});

test.each([
  {},
  { title: "" },
  { title: "   " },
  { title: 1 },
  { type: "OTHER" },
  { type: null },
  { targetDistanceMetres: 0 },
  { targetDistanceMetres: -1 },
  { targetDistanceMetres: 1.5 },
  { targetDistanceMetres: "5" },
  { targetDistanceMetres: null },
  { targetTimeSeconds: 0 },
  { targetTimeSeconds: -1 },
  { targetTimeSeconds: 1.5 },
  { targetTimeSeconds: null },
  { targetDate: "2026-02-30" },
  { targetDate: "tomorrow" },
  { targetDate: null },
  { description: " " },
  { description: null },
  { id: "id" },
  { athleteId: "athlete" },
  { status: "ACTIVE" },
  { createdAt: "2026-10-02T12:00:00Z" },
  { extra: true },
])("rejects invalid creation fields %j", (fields) => {
  const input =
    Object.keys(fields).length === 0
      ? fields
      : { title: "Goal", type: "RACE", ...fields };
  expect(createTrainingGoalRequestSchema.safeParse(input).success).toBe(false);
});

test.each(["ACTIVE", "COMPLETED", "DISCARDED"])(
  "accepts domain status %s",
  (status) => {
    expect(trainingGoalStatusSchema.parse(status)).toBe(status);
    const goal = createTrainingGoal({ status: status as "ACTIVE" });
    expect(trainingGoalSchema.parse(goal)).toEqual(goal);
  },
);

test.each([
  { id: "bad" },
  { athleteId: "bad" },
  { status: "OTHER" },
  { createdAt: "2026-10-02" },
])("rejects invalid read fields %j", (fields) => {
  expect(
    trainingGoalSchema.safeParse({ ...createTrainingGoal(), ...fields })
      .success,
  ).toBe(false);
});
