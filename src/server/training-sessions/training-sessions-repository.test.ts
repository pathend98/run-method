import type {
  CreateTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import type {
  TrainingSessionRow,
  TrainingSessionsTransformer,
} from "./training-sessions-transformer";

const createdAt = new Date("2026-08-01T10:00:00.000Z");
const updatedAt = new Date("2026-08-01T10:30:00.000Z");

const rows: TrainingSessionRow[] = [
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
];

const transformedRows: TrainingSession[] = [
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
];

class FakeTrainingSessionsTransformer implements TrainingSessionsTransformer {
  readonly transform = vi
    .fn<TrainingSessionsTransformer["transform"]>()
    .mockReturnValueOnce(transformedRows[0])
    .mockReturnValueOnce(transformedRows[1]);
}

function createRepository(transformer: TrainingSessionsTransformer) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const secondLeftJoin = vi.fn().mockReturnValue({ where });
  const firstLeftJoin = vi.fn().mockReturnValue({ leftJoin: secondLeftJoin });
  const from = vi.fn().mockReturnValue({ leftJoin: firstLeftJoin });
  const select = vi.fn().mockReturnValue({ from });
  const repository = new DrizzleTrainingSessionsRepository(
    {
      select,
    } as never,
    transformer,
  );

  return { orderBy, repository, transformer, where };
}

test("findBetweenDates queries ordered rows and delegates transformation in row order", async () => {
  const transformer = new FakeTrainingSessionsTransformer();
  const { orderBy, repository, where } = createRepository(transformer);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).resolves.toEqual(transformedRows);

  expect(where).toHaveBeenCalledOnce();
  expect(orderBy).toHaveBeenCalledOnce();
  expect(orderBy).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.anything(),
    expect.anything(),
  );
  expect(transformer.transform).toHaveBeenNthCalledWith(1, rows[0]);
  expect(transformer.transform).toHaveBeenNthCalledWith(2, rows[1]);
});

function createRepositoryForCreation(request: CreateTrainingSessionRequest) {
  const session = {
    id: "33333333-3333-4333-8333-333333333333",
    title: request.title,
    activityType: request.activityType,
    status: "SCHEDULED" as const,
    date: request.date,
    timeOfDay: request.timeOfDay,
    description: request.description,
    sortOrder: 4,
    skipReason: null,
    createdAt,
    updatedAt,
  };
  const runRow = {
    trainingSessionId: session.id,
    targetType: request.activityType === "RUN" ? request.targetType : "",
    targetDistanceMetres: null,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: null,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  };
  const strengthRow = {
    trainingSessionId: session.id,
    targetDurationSeconds: null,
    actualDurationSeconds: null,
  };
  const selectWhere = vi.fn().mockResolvedValue([{ nextOrder: "4" }]);
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const select = vi.fn().mockReturnValue({ from: selectFrom });
  const insertedValues: unknown[] = [];
  const insert = vi.fn().mockImplementation(() => ({
    values: vi.fn().mockImplementation((values) => {
      insertedValues.push(values);
      return {
        returning: vi
          .fn()
          .mockResolvedValue([
            insertedValues.length === 1
              ? session
              : request.activityType === "RUN"
                ? { ...runRow, ...values }
                : { ...strengthRow, ...values },
          ]),
      };
    }),
  }));
  const tx = { insert, select };
  const transaction = vi.fn().mockImplementation((callback) => callback(tx));
  const transformed = {
    id: session.id,
    title: session.title,
  } as TrainingSession;
  const transformer: TrainingSessionsTransformer = {
    transform: vi.fn().mockReturnValue(transformed),
  };
  const repository = new DrizzleTrainingSessionsRepository(
    { transaction } as never,
    transformer,
  );

  return {
    insertedValues,
    repository,
    selectWhere,
    transformed,
    transformer,
  };
}

const createRequests: CreateTrainingSessionRequest[] = [
  {
    title: "Distance duration",
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1500,
    date: "2026-08-26",
    timeOfDay: "AM",
    description: null,
  },
  {
    title: "Distance pace",
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 5000,
    targetPaceSecondsPerKilometre: 300,
    date: "2026-08-26",
    timeOfDay: null,
    description: "Steady",
  },
  {
    title: "Duration pace",
    activityType: "RUN",
    targetType: "DURATION_PACE",
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: 285,
    date: "2026-08-26",
    timeOfDay: "PM",
    description: null,
  },
  {
    title: "Strength",
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
  },
];

test.each(createRequests)(
  "creates $activityType session $title in a transaction",
  async (request) => {
    const {
      insertedValues,
      repository,
      selectWhere,
      transformed,
      transformer,
    } = createRepositoryForCreation(request);

    await expect(repository.create(request)).resolves.toBe(transformed);

    expect(selectWhere).toHaveBeenCalledOnce();
    expect(insertedValues[0]).toEqual({
      title: request.title,
      activityType: request.activityType,
      date: request.date,
      timeOfDay: request.timeOfDay,
      description: request.description,
      sortOrder: 4,
    });
    expect(insertedValues).toHaveLength(2);
    expect(transformer.transform).toHaveBeenCalledWith({
      session: expect.objectContaining({
        id: expect.any(String),
        sortOrder: 4,
      }),
      runDetails: request.activityType === "RUN" ? expect.any(Object) : null,
      strengthDetails:
        request.activityType === "STRENGTH" ? expect.any(Object) : null,
    });

    if (request.activityType === "RUN") {
      expect(insertedValues[1]).toMatchObject({
        targetType: request.targetType,
        targetDistanceMetres:
          "targetDistanceMetres" in request
            ? request.targetDistanceMetres
            : null,
        targetDurationSeconds:
          "targetDurationSeconds" in request
            ? request.targetDurationSeconds
            : null,
        targetPaceSecondsPerKilometre:
          "targetPaceSecondsPerKilometre" in request
            ? request.targetPaceSecondsPerKilometre
            : null,
      });
    } else {
      expect(insertedValues[1]).toMatchObject({
        targetDurationSeconds: request.targetDurationSeconds,
      });
    }
  },
);
