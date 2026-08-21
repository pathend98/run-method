import { TrainingSessionsDataIntegrityError } from "./training-sessions-errors";
import {
  DefaultTrainingSessionsTransformer,
  type TrainingSessionRow,
} from "./training-sessions-transformer";

const createdAt = new Date("2026-08-01T10:00:00.000Z");
const updatedAt = new Date("2026-08-01T10:30:00.000Z");

const runSession = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt,
  updatedAt,
};

const strengthSession = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Strength",
  activityType: "STRENGTH",
  status: "COMPLETED",
  date: "2026-08-17",
  timeOfDay: "PM",
  description: "Lower body",
  sortOrder: 1,
  skipReason: null,
  createdAt,
  updatedAt,
};

const runDetails = {
  trainingSessionId: "11111111-1111-4111-8111-111111111111",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const strengthDetails = {
  trainingSessionId: "22222222-2222-4222-8222-222222222222",
  targetDurationSeconds: 2700,
  actualDurationSeconds: 2400,
};

const transformer = new DefaultTrainingSessionsTransformer();

test("transforms run rows into training sessions", () => {
  expect(
    transformer.transform({
      session: runSession,
      runDetails,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toEqual({
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:30:00.000Z",
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    targetPaceSecondsPerKilometre: null,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  });
});

test("transforms strength rows into training sessions", () => {
  expect(
    transformer.transform({
      session: strengthSession,
      runDetails: null,
      strengthDetails,
    } as TrainingSessionRow),
  ).toEqual({
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    status: "COMPLETED",
    date: "2026-08-17",
    timeOfDay: "PM",
    description: "Lower body",
    sortOrder: 1,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:30:00.000Z",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
  });
});

test("rejects run rows without run details", () => {
  expect(() =>
    transformer.transform({
      session: runSession,
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow("Run session 11111111-1111-4111-8111-111111111111");
  expect(() =>
    transformer.transform({
      session: runSession,
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow(TrainingSessionsDataIntegrityError);
});

test("rejects strength rows without strength details", () => {
  expect(() =>
    transformer.transform({
      session: strengthSession,
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow("Strength session 22222222-2222-4222-8222-222222222222");
  expect(() =>
    transformer.transform({
      session: strengthSession,
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow(TrainingSessionsDataIntegrityError);
});

test("rejects unsupported activity types", () => {
  expect(() =>
    transformer.transform({
      session: {
        ...runSession,
        id: "33333333-3333-4333-8333-333333333333",
        title: "Ride",
        activityType: "BIKE",
        timeOfDay: null,
      },
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow("Unsupported activity type BIKE");
  expect(() =>
    transformer.transform({
      session: {
        ...runSession,
        id: "33333333-3333-4333-8333-333333333333",
        title: "Ride",
        activityType: "BIKE",
        timeOfDay: null,
      },
      runDetails: null,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow(TrainingSessionsDataIntegrityError);
});

test("rejects invalid time of day values", () => {
  expect(() =>
    transformer.transform({
      session: {
        ...runSession,
        timeOfDay: "NOON",
      },
      runDetails,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow("invalid time of day");
});

test("rejects invalid status values", () => {
  expect(() =>
    transformer.transform({
      session: {
        ...runSession,
        status: "DONE",
      },
      runDetails,
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow("invalid status");
});

test("rejects rows that do not match the domain read model", () => {
  expect(() =>
    transformer.transform({
      session: runSession,
      runDetails: {
        ...runDetails,
        targetDurationSeconds: null,
      },
      strengthDetails: null,
    } as TrainingSessionRow),
  ).toThrow(TrainingSessionsDataIntegrityError);
});
