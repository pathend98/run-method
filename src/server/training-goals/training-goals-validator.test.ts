import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { RequestValidationError } from "@/server/errors/request-validation-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";
import { DefaultTrainingGoalsValidator } from "./training-goals-validator";

const validator = new DefaultTrainingGoalsValidator();
const fields = {
  title: "Goal",
  purpose: "Fitness",
  trainingIntentions: "Run",
  startDate: "2026-06-01",
  targetDate: "2026-06-10",
};
const current = createTrainingGoal(fields);

test("normalizes creation and accepts past, future, and same-day periods", () => {
  expect(
    validator.validateCreate(
      {
        ...fields,
        title: " Goal ",
        purpose: " Fitness ",
        trainingIntentions: " Run ",
      },
      [],
    ),
  ).toEqual(fields);
  for (const date of ["2000-01-01", "2099-01-01"]) {
    expect(
      validator.validateCreate(
        { ...fields, startDate: date, targetDate: date },
        [],
      ),
    ).toMatchObject({ startDate: date, targetDate: date });
  }
});

test.each([
  { title: " " },
  { purpose: " " },
  { trainingIntentions: null },
  { startDate: "bad" },
  { targetDate: "2026-02-30" },
  { targetDate: "2026-05-31" },
  { type: "OPEN" },
])("rejects malformed creation %j", (invalid) => {
  expect(() =>
    validator.validateCreate({ ...fields, ...invalid } as never, []),
  ).toThrow(RequestValidationError);
});

test("returns structured field errors for reversed dates", () => {
  expect.assertions(1);
  try {
    validator.validateCreate({ ...fields, targetDate: "2026-05-31" }, []);
  } catch (error) {
    expect(error).toMatchObject({
      fieldErrors: {
        targetDate: ["Target date must be on or after start date"],
      },
    });
  }
});

test.each([
  ["2026-06-01", "2026-06-10"],
  ["2026-06-02", "2026-06-05"],
  ["2026-05-01", "2026-07-01"],
  ["2026-05-20", "2026-06-01"],
  ["2026-06-10", "2026-06-20"],
])("rejects inclusive overlap with %s through %s", (startDate, targetDate) => {
  expect(() =>
    validator.validateCreate(fields, [
      createTrainingGoal({ startDate, targetDate }),
    ]),
  ).toThrow(TrainingGoalOverlapError);
});

test("accepts non-overlapping periods before and after the candidate", () => {
  expect(
    validator.validateCreate(fields, [
      createTrainingGoal({ startDate: "2026-05-01", targetDate: "2026-05-31" }),
      createTrainingGoal({ startDate: "2026-06-11", targetDate: "2026-06-20" }),
    ]),
  ).toEqual(fields);
});

test.each(["completed", "discarded"] as const)(
  "ignores %s goals",
  (resolution) => {
    expect(
      validator.validateCreate(fields, [
        createTrainingGoal({
          ...fields,
          resolution,
          resolvedAt: "2026-06-10T12:00:00Z",
        }),
      ]),
    ).toEqual(fields);
  },
);

test("merges and normalizes an edit while excluding the current goal", () => {
  expect(
    validator.validateEdit(current, { title: " Updated " }, [current]),
  ).toEqual({ ...fields, title: "Updated" });
  expect(
    validator.validateEdit(
      current,
      {
        title: "New",
        purpose: " Health ",
        trainingIntentions: " Easy runs ",
        startDate: "2026-06-05",
        targetDate: "2026-06-15",
      },
      [current],
    ),
  ).toEqual({
    title: "New",
    purpose: "Health",
    trainingIntentions: "Easy runs",
    startDate: "2026-06-05",
    targetDate: "2026-06-15",
  });
});

test.each([{ startDate: "2026-06-11" }, { targetDate: "2026-05-31" }])(
  "validates merged dates for partial edit %j",
  (edit) => {
    expect(() => validator.validateEdit(current, edit, [current])).toThrow(
      RequestValidationError,
    );
  },
);

test.each([
  {},
  { title: undefined },
  { title: null },
  { purpose: " " },
  { targetDate: null },
  { resolution: "completed" },
])("rejects malformed edits %j", (edit) => {
  expect(() => validator.validateEdit(current, edit as never, [])).toThrow(
    RequestValidationError,
  );
});

test("rejects an edited period which overlaps another unresolved goal", () => {
  const other = createTrainingGoal({
    id: "22222222-2222-4222-8222-222222222222",
    startDate: "2026-06-15",
    targetDate: "2026-06-20",
  });
  expect(() =>
    validator.validateEdit(current, { targetDate: "2026-06-15" }, [
      current,
      other,
    ]),
  ).toThrow(TrainingGoalOverlapError);
});
