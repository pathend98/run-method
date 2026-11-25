import {
  trainingGoalFormSchema,
  defaultTrainingGoalFormValues,
} from "./training-goal-form";

const values = {
  title: "Goal",
  purpose: "Fitness",
  trainingIntentions: "Run regularly",
  startDate: "2026-11-01",
  targetDate: "2026-12-01",
};

test("requires every field", () => {
  expect(
    trainingGoalFormSchema.safeParse(defaultTrainingGoalFormValues).success,
  ).toBe(false);
  for (const field of Object.keys(values)) {
    expect(
      trainingGoalFormSchema.safeParse({ ...values, [field]: "" }).success,
    ).toBe(false);
  }
});

test("trims text and preserves internal line breaks", () => {
  expect(
    trainingGoalFormSchema.parse({
      ...values,
      title: " Goal ",
      purpose: " Fitness ",
      trainingIntentions: " Run regularly\nRecover well ",
    }),
  ).toEqual({ ...values, trainingIntentions: "Run regularly\nRecover well" });
});

test.each([
  { title: " " },
  { purpose: " " },
  { trainingIntentions: " " },
  { startDate: "2026-02-30" },
  { targetDate: "2026-02-30" },
  { startDate: "tomorrow" },
  { targetDate: "2026-10-31" },
])("rejects invalid values %j", (override) => {
  expect(
    trainingGoalFormSchema.safeParse({ ...values, ...override }).success,
  ).toBe(false);
});

test("allows a single-day goal", () => {
  expect(
    trainingGoalFormSchema.parse({ ...values, targetDate: values.startDate }),
  ).toMatchObject({ targetDate: values.startDate });
});
