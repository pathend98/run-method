import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { DefaultTrainingSessionsValidator } from "./training-sessions-validator";

const validator = new DefaultTrainingSessionsValidator();
const today = new Date("2026-08-26T12:00:00");

const runSession: TrainingSession = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-26",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const runEdit: EditTrainingSessionRequest = {
  title: "Long easy run",
  description: "Keep it relaxed",
  timeOfDay: "AM",
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
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

test("rejects run target type changes", () => {
  expect(() =>
    validator.validateEdit(runSession, {
      ...runEdit,
      targetType: "DISTANCE_PACE",
      targetDistanceMetres: 5000,
      targetPaceSecondsPerKilometre: 300,
    }),
  ).toThrow("targetType cannot be changed");
});

test("allows scheduled run target changes within the existing target type", () => {
  expect(() =>
    validator.validateEdit(runSession, {
      ...runEdit,
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
    }),
  ).not.toThrow();
});

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
  {
    name: "pace",
    current: {
      ...runSession,
      status: "COMPLETED" as const,
      targetType: "DISTANCE_PACE" as const,
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    },
    request: {
      ...runEdit,
      targetType: "DISTANCE_PACE" as const,
      targetDistanceMetres: 5000,
      targetPaceSecondsPerKilometre: 301,
    },
  },
])("rejects terminal run $name target changes", ({ current, request }) => {
  expect(() => validator.validateEdit(current, request)).toThrow(
    "run targets cannot be changed for completed or skipped sessions",
  );
});

test.each([
  {
    targetType: "DISTANCE_DURATION" as const,
    currentTargets: {
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
      targetPaceSecondsPerKilometre: null,
    },
    requestTargets: {
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
    },
  },
  {
    targetType: "DISTANCE_PACE" as const,
    currentTargets: {
      targetDistanceMetres: 5000,
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    },
    requestTargets: {
      targetDistanceMetres: 5000,
      targetPaceSecondsPerKilometre: 300,
    },
  },
  {
    targetType: "DURATION_PACE" as const,
    currentTargets: {
      targetDistanceMetres: null,
      targetDurationSeconds: 1800,
      targetPaceSecondsPerKilometre: 300,
    },
    requestTargets: {
      targetDurationSeconds: 1800,
      targetPaceSecondsPerKilometre: 300,
    },
  },
])(
  "allows terminal $targetType runs when targets are unchanged",
  ({ targetType, currentTargets, requestTargets }) => {
    const current = {
      ...runSession,
      status: "COMPLETED" as const,
      targetType,
      ...currentTargets,
    } as TrainingSession;
    const request = {
      title: runEdit.title,
      description: runEdit.description,
      timeOfDay: runEdit.timeOfDay,
      activityType: "RUN" as const,
      targetType,
      ...requestTargets,
    } as EditTrainingSessionRequest;

    expect(() => validator.validateEdit(current, request)).not.toThrow();
  },
);

test.each(["COMPLETED", "SKIPPED"] as const)(
  "rejects skipping a %s session",
  (status) => {
    expect(() =>
      validator.validateSkip({
        ...runSession,
        status,
        skipReason: status === "SKIPPED" ? "Recovery" : null,
      }),
    ).toThrow("only scheduled training sessions can be skipped");
  },
);

test.each([
  ["skip", "skipped", (validator: DefaultTrainingSessionsValidator) =>
    validator.validateSkip({ ...runSession, date: "2026-08-27" })],
  [
    "complete",
    "completed",
    (validator: DefaultTrainingSessionsValidator) =>
      validator.validateComplete(
        { ...runSession, date: "2026-08-27" },
        { actualDurationSeconds: 1500, actualDistanceMetres: 5000 },
      ),
  ],
] as const)(
  "rejects future sessions when attempting to %s",
  (_operation, transition, validate) => {
    const validator = new DefaultTrainingSessionsValidator(() => today);

    expect(() => validate(validator)).toThrow(
      `future training sessions cannot be ${transition}`,
    );
  },
);

test.each([
  ["today", "2026-08-26"],
  ["past", "2026-08-25"],
])("allows skipping a %s session", (_description, date) => {
  const validator = new DefaultTrainingSessionsValidator(() => today);

  expect(() => validator.validateSkip({ ...runSession, date })).not.toThrow();
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
    ),
  ).not.toThrow();
});

test("rejects future strength session transitions", () => {
  const validator = new DefaultTrainingSessionsValidator(() => today);
  const strength: TrainingSession = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SCHEDULED",
    date: "2026-08-27",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 1800,
    actualDurationSeconds: null,
  };

  expect(() => validator.validateSkip(strength)).toThrow(
    "future training sessions cannot be skipped",
  );
  expect(() =>
    validator.validateComplete(strength, { actualDurationSeconds: 1500 }),
  ).toThrow("future training sessions cannot be completed");
});

test("requires distance to complete runs", () => {
  expect(() =>
    validator.validateComplete(runSession, { actualDurationSeconds: 1500 }),
  ).toThrow("actualDistanceMetres is required to complete a run");
});

test("allows run completion actuals", () => {
  expect(() =>
    validator.validateComplete(runSession, {
      actualDurationSeconds: 1500,
      actualDistanceMetres: 5000,
    }),
  ).not.toThrow();
});

test("rejects distance when completing strength sessions", () => {
  const strength: TrainingSession = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SCHEDULED",
    date: "2026-08-26",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 1800,
    actualDurationSeconds: null,
  };

  expect(() =>
    validator.validateComplete(strength, {
      actualDurationSeconds: 1500,
      actualDistanceMetres: 5000,
    }),
  ).toThrow("actualDistanceMetres is not allowed for strength sessions");
});

test("allows title and description edits on terminal strength sessions", () => {
  const current: TrainingSession = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SKIPPED",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    sortOrder: 0,
    skipReason: "Sick",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 1800,
    actualDurationSeconds: null,
  };

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
    const current: TrainingSession = {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Strength",
      activityType: "STRENGTH",
      status,
      date: "2026-08-26",
      timeOfDay: null,
      description: null,
      sortOrder: 0,
      skipReason: status === "SKIPPED" ? "Sick" : null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDurationSeconds: 1800,
      actualDurationSeconds: null,
    };

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
