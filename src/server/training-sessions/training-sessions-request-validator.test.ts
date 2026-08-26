import { TrainingSessionsRequestValidationError } from "./training-sessions-errors";
import { DefaultTrainingSessionsRequestValidator } from "./training-sessions-request-validator";

const validator = new DefaultTrainingSessionsRequestValidator();

test("validates a run creation request and applies optional defaults", () => {
  expect(
    validator.validateCreate({
      title: " Easy run ",
      date: "2026-08-26",
      activityType: "RUN",
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 1000,
      targetDurationSeconds: 240,
    }),
  ).toEqual({
    title: "Easy run",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 1000,
    targetDurationSeconds: 240,
  });
});

test("validates a strength creation request", () => {
  expect(
    validator.validateCreate({
      title: "Strength",
      date: "2026-08-26",
      activityType: "STRENGTH",
      targetDurationSeconds: 1800,
    }),
  ).toMatchObject({
    activityType: "STRENGTH",
    targetDurationSeconds: 1800,
  });
});

test("reports fields from the matching activity branch", () => {
  try {
    validator.validateCreate({
      title: "test",
      date: "2026-08-26",
      activityType: "RUN",
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 1000,
      targeDurationSeconds: 240,
    });
  } catch (error) {
    expect(error).toBeInstanceOf(TrainingSessionsRequestValidationError);
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      targetDurationSeconds: [
        "Invalid input: expected number, received undefined",
      ],
      targeDurationSeconds: ['Unrecognized key: "targeDurationSeconds"'],
    });
  }
});

test("reports an invalid activity type without unrelated branch errors", () => {
  try {
    validator.validateCreate({
      title: "test",
      date: "2026-08-26",
      activityType: "BIKE",
    });
  } catch (error) {
    expect(error).toBeInstanceOf(TrainingSessionsRequestValidationError);
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      activityType: ['Invalid input: expected "STRENGTH"'],
    });
  }
});
