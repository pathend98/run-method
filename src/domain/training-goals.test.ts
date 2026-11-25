import {
  createTrainingGoalRequestSchema,
  isTrainingGoalActive,
  editTrainingGoalRequestSchema,
  trainingGoalSchema,
} from "./training-goals";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";

const input = {
  title: "Goal",
  purpose: "Fitness",
  trainingIntentions: "Run regularly",
  startDate: "2026-10-02",
  targetDate: "2026-12-01",
};

test("trims text and accepts past and same-day periods", () => {
  expect(
    createTrainingGoalRequestSchema.parse({
      ...input,
      title: " Goal ",
      purpose: " Fitness ",
      trainingIntentions: " Run regularly ",
    }),
  ).toEqual(input);
  expect(
    createTrainingGoalRequestSchema.parse({
      ...input,
      startDate: "2000-01-01",
      targetDate: "2000-01-01",
    }),
  ).toMatchObject({ startDate: "2000-01-01" });
});

test.each(Object.keys(input))("requires %s", (field) => {
  expect(
    createTrainingGoalRequestSchema.safeParse({ ...input, [field]: undefined })
      .success,
  ).toBe(false);
  expect(
    createTrainingGoalRequestSchema.safeParse({ ...input, [field]: null })
      .success,
  ).toBe(false);
});

test.each(["title", "purpose", "trainingIntentions"])(
  "rejects blank %s",
  (field) => {
    expect(
      createTrainingGoalRequestSchema.safeParse({ ...input, [field]: " " })
        .success,
    ).toBe(false);
  },
);

test.each([
  "type",
  "status",
  "description",
  "targetDistanceMetres",
  "targetTimeSeconds",
  "id",
  "athleteId",
  "createdAt",
  "resolution",
  "resolvedAt",
])("rejects server-owned or obsolete field %s", (field) => {
  expect(
    createTrainingGoalRequestSchema.safeParse({ ...input, [field]: "value" })
      .success,
  ).toBe(false);
  expect(
    editTrainingGoalRequestSchema.safeParse({ title: "New", [field]: "value" })
      .success,
  ).toBe(false);
});

test.each([
  { targetDate: "2026-10-01" },
  { startDate: "2026-02-30" },
  { targetDate: "tomorrow" },
])("rejects invalid period %j", (fields) => {
  expect(
    createTrainingGoalRequestSchema.safeParse({ ...input, ...fields }).success,
  ).toBe(false);
});

test("accepts partial updates, leaving merged date validation to the server", () => {
  expect(editTrainingGoalRequestSchema.parse({ title: " New " })).toEqual({
    title: "New",
  });
  expect(
    editTrainingGoalRequestSchema.parse({ startDate: "2027-01-01" }),
  ).toEqual({ startDate: "2027-01-01" });
});

test.each([
  {},
  { title: undefined },
  { title: null },
  { purpose: " " },
  { targetDate: null },
  { startDate: "bad" },
])("rejects invalid edit %j", (fields) => {
  expect(editTrainingGoalRequestSchema.safeParse(fields).success).toBe(false);
});

test.each([null, "completed", "discarded"] as const)(
  "accepts consistent resolution %s",
  (resolution) => {
    const goal = createTrainingGoal({
      resolution,
      resolvedAt: resolution === null ? null : "2026-11-25T12:00:00.000Z",
    });
    expect(trainingGoalSchema.parse(goal)).toEqual(goal);
  },
);

test.each([
  { id: "bad" },
  { athleteId: "bad" },
  { createdAt: "2026-01-01" },
  { resolution: "ACTIVE" },
  { resolution: "completed", resolvedAt: null },
  { resolvedAt: "2026-11-25T12:00:00Z" },
  { targetDate: "2026-01-01" },
  { type: "OPEN" },
])("rejects invalid read fields %j", (fields) => {
  expect(
    trainingGoalSchema.safeParse({ ...createTrainingGoal(), ...fields })
      .success,
  ).toBe(false);
});

test.each([
  [{}, true],
  [{ startDate: "2026-11-25" }, true],
  [{ targetDate: "2026-11-25" }, true],
  [{ startDate: "2026-11-25", targetDate: "2026-11-25" }, true],
  [{ startDate: "2026-11-26" }, false],
  [{ targetDate: "2026-11-24" }, false],
  [{ resolution: "completed" as const }, false],
  [{ resolution: "discarded" as const }, false],
])("derives active state for %j", (fields, expected) => {
  expect(isTrainingGoalActive(createTrainingGoal(fields), "2026-11-25")).toBe(
    expected,
  );
});
