import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import { TrainingSessionsDataIntegrityError } from "./training-sessions-errors";

const createdAt = new Date("2026-08-01T10:00:00.000Z");
const updatedAt = new Date("2026-08-01T10:30:00.000Z");

function createRepository(rows: unknown[]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const secondLeftJoin = vi.fn().mockReturnValue({ where });
  const firstLeftJoin = vi.fn().mockReturnValue({ leftJoin: secondLeftJoin });
  const from = vi.fn().mockReturnValue({ leftJoin: firstLeftJoin });
  const select = vi.fn().mockReturnValue({ from });
  const repository = new DrizzleTrainingSessionsRepository({
    select,
  } as never);

  return { orderBy, repository, where };
}

test("findBetweenDates maps run and strength rows with deterministic ordering", async () => {
  const { orderBy, repository, where } = createRepository([
    {
      session: {
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
      },
      runDetails: {
        trainingSessionId: "11111111-1111-4111-8111-111111111111",
        targetType: "DISTANCE_DURATION",
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      },
      strengthDetails: null,
    },
    {
      session: {
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
      },
      runDetails: null,
      strengthDetails: {
        trainingSessionId: "22222222-2222-4222-8222-222222222222",
        targetDurationSeconds: 2700,
        actualDurationSeconds: 2400,
      },
    },
  ]);
  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).resolves.toEqual([
    {
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
    },
    {
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
    },
  ]);

  expect(where).toHaveBeenCalledOnce();
  expect(orderBy).toHaveBeenCalledOnce();
  expect(orderBy).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
  );
});

test("findBetweenDates rejects run rows without run details", async () => {
  const { repository } = createRepository([
    {
      session: {
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
      },
      runDetails: null,
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toThrow("Run session 11111111-1111-4111-8111-111111111111");
  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toBeInstanceOf(TrainingSessionsDataIntegrityError);
});

test("findBetweenDates rejects strength rows without strength details", async () => {
  const { repository } = createRepository([
    {
      session: {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Strength",
        activityType: "STRENGTH",
        status: "SCHEDULED",
        date: "2026-08-17",
        timeOfDay: "PM",
        description: null,
        sortOrder: 0,
        skipReason: null,
        createdAt,
        updatedAt,
      },
      runDetails: null,
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toThrow("Strength session 22222222-2222-4222-8222-222222222222");
  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toBeInstanceOf(TrainingSessionsDataIntegrityError);
});

test("findBetweenDates rejects unsupported activity types", async () => {
  const { repository } = createRepository([
    {
      session: {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Ride",
        activityType: "BIKE",
        status: "SCHEDULED",
        date: "2026-08-17",
        timeOfDay: null,
        description: null,
        sortOrder: 0,
        skipReason: null,
        createdAt,
        updatedAt,
      },
      runDetails: null,
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toThrow("Unsupported activity type BIKE");
  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toBeInstanceOf(TrainingSessionsDataIntegrityError);
});

test("findBetweenDates rejects invalid time of day values", async () => {
  const { repository } = createRepository([
    {
      session: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Easy run",
        activityType: "RUN",
        status: "SCHEDULED",
        date: "2026-08-17",
        timeOfDay: "NOON",
        description: null,
        sortOrder: 0,
        skipReason: null,
        createdAt,
        updatedAt,
      },
      runDetails: {
        trainingSessionId: "11111111-1111-4111-8111-111111111111",
        targetType: "DISTANCE_DURATION",
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      },
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toThrow("invalid time of day");
});

test("findBetweenDates rejects invalid status values", async () => {
  const { repository } = createRepository([
    {
      session: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Easy run",
        activityType: "RUN",
        status: "DONE",
        date: "2026-08-17",
        timeOfDay: "AM",
        description: null,
        sortOrder: 0,
        skipReason: null,
        createdAt,
        updatedAt,
      },
      runDetails: {
        trainingSessionId: "11111111-1111-4111-8111-111111111111",
        targetType: "DISTANCE_DURATION",
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      },
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toThrow("invalid status");
});

test("findBetweenDates rejects rows that do not match the domain read model", async () => {
  const { repository } = createRepository([
    {
      session: {
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
      },
      runDetails: {
        trainingSessionId: "11111111-1111-4111-8111-111111111111",
        targetType: "DISTANCE_DURATION",
        targetDistanceMetres: 8000,
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      },
      strengthDetails: null,
    },
  ]);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).rejects.toBeInstanceOf(TrainingSessionsDataIntegrityError);
});
