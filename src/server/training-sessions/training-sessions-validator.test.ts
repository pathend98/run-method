import { TrainingSessionsTransitionConflictError } from "./training-sessions-errors";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { DefaultTrainingSessionsValidator } from "./training-sessions-validator";

const validator = new DefaultTrainingSessionsValidator();
const today = new Date("2026-08-26T12:00:00");
const timeZone = "UTC";

const runSession: TrainingSession = createRunActivity({
  title: "Easy run",
  date: "2026-08-26",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
});

const runEdit: EditTrainingSessionRequest = {
  title: "Long easy run",
  description: "Keep it relaxed",
  timeOfDay: "AM",
  activityType: "RUN",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
};

test("rejects activity type changes", () => {
  expect(() =>
    validator.validateEdit(runSession, {
      title: "Strength",
      description: null,
      timeOfDay: "AM",
      activityType: "STRENGTH",
      targetDurationSeconds: 1500,
    }),
  ).toThrow("activityType cannot be changed");
});

test("allows scheduled run target changes", () => {
  expect(() =>
    validator.validateEdit(runSession, {
      ...runEdit,
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
    }),
  ).not.toThrow();
});

test("allows scheduled date changes", () => {
  expect(() =>
    validator.validateEdit(runSession, { ...runEdit, date: "2026-08-27" }),
  ).not.toThrow();
});

test.each(["COMPLETED", "SKIPPED"] as const)(
  "rejects date changes for %s sessions",
  (status) => {
    expect(() =>
      validator.validateEdit(
        {
          ...runSession,
          status,
          skipReason: status === "SKIPPED" ? "Recovery" : null,
        },
        { ...runEdit, date: "2026-08-27" },
      ),
    ).toThrow("date cannot be changed for completed or skipped sessions");
  },
);

test("rejects time of day changes for terminal sessions", () => {
  expect(() =>
    validator.validateEdit(
      { ...runSession, status: "COMPLETED" },
      { ...runEdit, timeOfDay: "PM" },
    ),
  ).toThrow("timeOfDay cannot be changed for completed or skipped sessions");
});

test.each([
  {
    name: "distance",
    current: { ...runSession, status: "COMPLETED" as const },
    request: { ...runEdit, targetDistanceMetres: 5001 },
  },
  {
    name: "duration",
    current: { ...runSession, status: "SKIPPED" as const },
    request: { ...runEdit, targetDurationSeconds: 1501 },
  },
])("rejects terminal run $name target changes", ({ current, request }) => {
  expect(() => validator.validateEdit(current, request)).toThrow(
    "run targets cannot be changed for completed or skipped sessions",
  );
});

test("allows terminal runs when targets are unchanged", () => {
  expect(() =>
    validator.validateEdit({ ...runSession, status: "COMPLETED" }, runEdit),
  ).not.toThrow();
});

test.each(["SCHEDULED", "SKIPPED"] as const)(
  "rejects actual metric edits for %s sessions",
  (status) => {
    expect(() =>
      validator.validateEdit(
        {
          ...runSession,
          status,
          skipReason: status === "SKIPPED" ? "Sick" : null,
        },
        { ...runEdit, actualDistanceMetres: 5100 },
      ),
    ).toThrow("actual metrics can only be changed for completed sessions");
  },
);

test("allows actual metric edits for completed sessions", () => {
  expect(() =>
    validator.validateEdit(
      {
        ...runSession,
        status: "COMPLETED",
        actualDistanceMetres: 5000,
        actualDurationSeconds: 1500,
      },
      { ...runEdit, actualDistanceMetres: 5100, actualDurationSeconds: 1530 },
    ),
  ).not.toThrow();
});

test.each(["COMPLETED", "SKIPPED"] as const)(
  "rejects skipping a %s session",
  (status) => {
    expect(() =>
      validator.validateSkip(
        {
          ...runSession,
          status,
          skipReason: status === "SKIPPED" ? "Recovery" : null,
        },
        timeZone,
      ),
    ).toThrow(
      new TrainingSessionsTransitionConflictError(
        "only scheduled training sessions can be skipped",
      ),
    );
  },
);

test.each([
  [
    "skip",
    "skipped",
    (validator: DefaultTrainingSessionsValidator) =>
      validator.validateSkip({ ...runSession, date: "2026-08-27" }, timeZone),
  ],
  [
    "complete",
    "completed",
    (validator: DefaultTrainingSessionsValidator) =>
      validator.validateComplete(
        { ...runSession, date: "2026-08-27" },
        { actualDurationSeconds: 1500, actualDistanceMetres: 5000 },
        timeZone,
      ),
  ],
] as const)(
  "rejects future sessions when attempting to %s",
  (_operation, transition, validate) => {
    const validator = new DefaultTrainingSessionsValidator(() => today);

    expect(() => validate(validator)).toThrow(
      new TrainingSessionsTransitionConflictError(
        `future training sessions cannot be ${transition}`,
      ),
    );
  },
);

test.each([
  ["today", "2026-08-26"],
  ["past", "2026-08-25"],
])("allows skipping a %s session", (_description, date) => {
  const validator = new DefaultTrainingSessionsValidator(() => today);

  expect(() =>
    validator.validateSkip({ ...runSession, date }, timeZone),
  ).not.toThrow();
});

test.each([
  ["today", "2026-08-26"],
  ["past", "2026-08-25"],
])("allows completing a %s session", (_description, date) => {
  const validator = new DefaultTrainingSessionsValidator(() => today);

  expect(() =>
    validator.validateComplete(
      { ...runSession, date },
      { actualDurationSeconds: 1500, actualDistanceMetres: 5000 },
      timeZone,
    ),
  ).not.toThrow();
});

test("uses the supplied IANA timezone to determine the current date", () => {
  const validator = new DefaultTrainingSessionsValidator(
    () => new Date("2026-08-26T12:00:00.000Z"),
  );
  const tomorrowInAuckland = { ...runSession, date: "2026-08-27" };

  expect(() =>
    validator.validateSkip(tomorrowInAuckland, "Pacific/Auckland"),
  ).not.toThrow();
  expect(() =>
    validator.validateSkip(tomorrowInAuckland, "America/Los_Angeles"),
  ).toThrow("future training sessions cannot be skipped");
});

test.each([
  [null, "Time-Zone header is required"],
  ["Not/AZone", "Time-Zone header must be a valid IANA timezone"],
])("rejects %s timezone headers", (header, message) => {
  const validator = new DefaultTrainingSessionsValidator(() => today);

  expect(() => validator.validateSkip(runSession, header)).toThrow(message);
});

test("rejects future strength session transitions", () => {
  const validator = new DefaultTrainingSessionsValidator(() => today);
  const strength: TrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-08-27",
    targetDurationSeconds: 1800,
  });

  expect(() => validator.validateSkip(strength, timeZone)).toThrow(
    "future training sessions cannot be skipped",
  );
  expect(() =>
    validator.validateComplete(
      strength,
      { actualDurationSeconds: 1500 },
      timeZone,
    ),
  ).toThrow("future training sessions cannot be completed");
});

test("requires distance to complete runs", () => {
  expect(() =>
    validator.validateComplete(
      runSession,
      { actualDurationSeconds: 1500 },
      timeZone,
    ),
  ).toThrow("actualDistanceMetres is required to complete a run");
});

test("allows run completion actuals", () => {
  expect(() =>
    validator.validateComplete(
      runSession,
      {
        actualDurationSeconds: 1500,
        actualDistanceMetres: 5000,
      },
      timeZone,
    ),
  ).not.toThrow();
});

test("rejects distance when completing strength sessions", () => {
  const strength: TrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-08-26",
    targetDurationSeconds: 1800,
  });

  expect(() =>
    validator.validateComplete(
      strength,
      {
        actualDurationSeconds: 1500,
        actualDistanceMetres: 5000,
      },
      timeZone,
    ),
  ).toThrow("actualDistanceMetres is not allowed for strength sessions");
});

test("allows title and description edits on terminal strength sessions", () => {
  const current: TrainingSession = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    status: "SKIPPED",
    date: "2026-08-26",
    timeOfDay: null,
    skipReason: "Sick",
    targetDurationSeconds: 1800,
  });

  expect(() =>
    validator.validateEdit(current, {
      title: "Revised strength",
      description: "Upper body",
      timeOfDay: null,
      activityType: "STRENGTH",
      targetDurationSeconds: current.targetDurationSeconds,
    }),
  ).not.toThrow();
});

test.each([
  ["completed", "COMPLETED" as const, 1801],
  ["skipped", "SKIPPED" as const, null],
])(
  "rejects changed strength duration for %s sessions",
  (_name, status, targetDurationSeconds) => {
    const current: TrainingSession = createStrengthActivity({
      id: "22222222-2222-4222-8222-222222222222",
      status,
      date: "2026-08-26",
      timeOfDay: null,
      skipReason: status === "SKIPPED" ? "Sick" : null,
      targetDurationSeconds: 1800,
    });

    expect(() =>
      validator.validateEdit(current, {
        title: current.title,
        description: current.description,
        timeOfDay: current.timeOfDay,
        activityType: "STRENGTH",
        targetDurationSeconds,
      }),
    ).toThrow(
      "strength target duration cannot be changed for completed or skipped sessions",
    );
  },
);

test.each(["COMPLETED", "SKIPPED"] as const)(
  "completion rejects %s with a conflict",
  (status) => {
    expect(() =>
      validator.validateComplete(
        { ...runSession, status },
        { actualDistanceMetres: 5000, actualDurationSeconds: 1500 },
        timeZone,
      ),
    ).toThrow(
      new TrainingSessionsTransitionConflictError(
        "only scheduled training sessions can be completed",
      ),
    );
  },
);
