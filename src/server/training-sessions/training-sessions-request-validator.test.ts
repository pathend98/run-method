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

test("reports primitive bodies once at the body path", () => {
  expect(() => validator.validateCreate(null)).toThrow(
    TrainingSessionsRequestValidationError,
  );

  try {
    validator.validateCreate(null);
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({ body: ["Invalid input: expected object, received null"] });
  }
});

test("reports invalid run target discriminators", () => {
  try {
    validator.validateCreate({
      title: "Run",
      date: "2026-08-26",
      activityType: "RUN",
      targetType: "INVALID",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      targetType: [
        "Invalid discriminator value. Expected 'DISTANCE_DURATION' | 'DISTANCE_PACE' | 'DURATION_PACE'",
      ],
    });
  }
});

test("reports direct errors for recognized activity types", () => {
  try {
    validator.validateCreate({
      title: "Strength",
      date: "invalid",
      activityType: "STRENGTH",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({ date: ["Invalid ISO date"] });
  }
});

test("reports errors from the strength branch", () => {
  try {
    validator.validateCreate({
      title: "Strength",
      date: "2026-08-26",
      activityType: "STRENGTH",
      targetDurationSeconds: "long",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      targetDurationSeconds: [
        "Invalid input: expected number, received string",
      ],
    });
  }
});

test("validates an edit request and trims editable text", () => {
  expect(
    validator.validateEdit({
      title: " Easy run ",
      description: " Aerobic work ",
      timeOfDay: "AM",
      activityType: "RUN",
      targetType: "DISTANCE_PACE",
      targetDistanceMetres: 5000,
      targetPaceSecondsPerKilometre: 300,
    }),
  ).toEqual({
    title: "Easy run",
    description: "Aerobic work",
    timeOfDay: "AM",
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 5000,
    targetPaceSecondsPerKilometre: 300,
  });
});

test("validates a nullable strength duration edit", () => {
  expect(
    validator.validateEdit({
      title: "Strength",
      description: null,
      timeOfDay: null,
      activityType: "STRENGTH",
      targetDurationSeconds: null,
    }),
  ).toEqual({
    title: "Strength",
    description: null,
    timeOfDay: null,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
  });
});

test("reports strength duration edit errors from the matching branch", () => {
  try {
    validator.validateEdit({
      title: "Strength",
      description: null,
      timeOfDay: null,
      activityType: "STRENGTH",
      targetDurationSeconds: "long",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      targetDurationSeconds: [
        "Invalid input: expected number, received string",
      ],
    });
  }
});

test("edit validation rejects omitted and immutable fields", () => {
  try {
    validator.validateEdit({
      description: null,
      timeOfDay: null,
      activityType: "STRENGTH",
      date: "2026-08-27",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      title: ["Invalid input: expected string, received undefined"],
      targetDurationSeconds: [
        "Invalid input: expected number, received undefined",
      ],
      date: ['Unrecognized key: "date"'],
    });
  }
});
