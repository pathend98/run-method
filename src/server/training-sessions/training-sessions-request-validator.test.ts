import { TrainingSessionsRequestValidationError } from "./training-sessions-errors";
import { DefaultTrainingSessionsRequestValidator } from "./training-sessions-request-validator";

const validator = new DefaultTrainingSessionsRequestValidator();

test("validates skip requests", () => {
  expect(validator.validateSkip({ skipReason: "  Recovery  " })).toEqual({
    skipReason: "Recovery",
  });
});

test("reports skip request field errors", () => {
  expect(() => validator.validateSkip({ skipReason: "" })).toThrow(
    TrainingSessionsRequestValidationError,
  );

  try {
    validator.validateSkip({ skipReason: "Rest", unexpected: true });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toHaveProperty("unexpected");
  }
});

test("validates completion requests", () => {
  expect(
    validator.validateComplete({
      actualDurationSeconds: 1500,
      actualDistanceMetres: 5000,
    }),
  ).toEqual({ actualDurationSeconds: 1500, actualDistanceMetres: 5000 });
});

test("reports completion request field errors", () => {
  try {
    validator.validateComplete({ actualDurationSeconds: 0 });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toHaveProperty("actualDurationSeconds");
  }
});

test("validates a run creation request and applies optional defaults", () => {
  expect(
    validator.validateCreate({
      title: " Easy run ",
      date: "2026-08-26",
      activityType: "RUN",
      targetDistanceMetres: 1000,
      targetDurationSeconds: 240,
    }),
  ).toEqual({
    title: "Easy run",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    activityType: "RUN",
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
      activityType: [
        'Invalid input: expected "RUN"',
        'Invalid input: expected "STRENGTH"',
      ],
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

test("reports missing canonical run targets", () => {
  try {
    validator.validateCreate({
      title: "Run",
      date: "2026-08-26",
      activityType: "RUN",
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      targetDistanceMetres: [
        "Invalid input: expected number, received undefined",
      ],
      targetDurationSeconds: [
        "Invalid input: expected number, received undefined",
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
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
    }),
  ).toEqual({
    title: "Easy run",
    description: "Aerobic work",
    timeOfDay: "AM",
    activityType: "RUN",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1500,
  });
});

test("validates an optional edit date", () => {
  expect(
    validator.validateEdit({
      title: "Easy run",
      date: "2026-08-27",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
    }),
  ).toMatchObject({ date: "2026-08-27" });
});

test("reports invalid edit dates at the date field", () => {
  try {
    validator.validateEdit({
      title: "Easy run",
      date: "invalid",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({ date: ["Invalid ISO date"] });
  }
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

test("validates optional actual metrics on matching edit activity types", () => {
  expect(
    validator.validateEdit({
      title: "Completed run",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
      actualDistanceMetres: 5100,
      actualDurationSeconds: 1530,
    }),
  ).toMatchObject({ actualDistanceMetres: 5100, actualDurationSeconds: 1530 });

  expect(
    validator.validateEdit({
      title: "Completed strength",
      description: null,
      timeOfDay: null,
      activityType: "STRENGTH",
      targetDurationSeconds: null,
      actualDurationSeconds: 1800,
    }),
  ).toMatchObject({ actualDurationSeconds: 1800 });
});

test("rejects invalid and mismatched actual metrics on edits", () => {
  try {
    validator.validateEdit({
      title: "Strength",
      description: null,
      timeOfDay: null,
      activityType: "STRENGTH",
      targetDurationSeconds: null,
      actualDurationSeconds: 0,
      actualDistanceMetres: 5000,
    });
  } catch (error) {
    expect(
      (error as TrainingSessionsRequestValidationError).fieldErrors,
    ).toEqual({
      actualDurationSeconds: ["Too small: expected number to be >0"],
      actualDistanceMetres: ['Unrecognized key: "actualDistanceMetres"'],
    });
  }
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
    });
  }
});
