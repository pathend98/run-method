import type { TrainingSession } from "@/domain/training-sessions";
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
