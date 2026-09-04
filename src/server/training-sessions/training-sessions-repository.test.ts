import type {
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
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
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
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
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
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

function createRepositoryForFindById(result: TrainingSessionRow[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const secondLeftJoin = vi.fn().mockReturnValue({ where });
  const firstLeftJoin = vi.fn().mockReturnValue({ leftJoin: secondLeftJoin });
  const from = vi.fn().mockReturnValue({ leftJoin: firstLeftJoin });
  const select = vi.fn().mockReturnValue({ from });
  const transformer: TrainingSessionsTransformer = {
    transform: vi.fn().mockReturnValue(transformedRows[0]),
  };
  const repository = new DrizzleTrainingSessionsRepository(
    { select } as never,
    transformer,
  );

  return { limit, repository, transformer };
}

test("findById returns a transformed aggregate", async () => {
  const { limit, repository, transformer } = createRepositoryForFindById([
    rows[0],
  ]);

  await expect(repository.findById(transformedRows[0].id)).resolves.toBe(
    transformedRows[0],
  );
  expect(limit).toHaveBeenCalledWith(1);
  expect(transformer.transform).toHaveBeenCalledWith(rows[0]);
});

test("findById returns null when no aggregate exists", async () => {
  const { repository, transformer } = createRepositoryForFindById([]);

  await expect(repository.findById(transformedRows[0].id)).resolves.toBeNull();
  expect(transformer.transform).not.toHaveBeenCalled();
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
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1500,
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
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1500,
    date: "2026-08-26",
    timeOfDay: "AM",
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
        targetDistanceMetres: request.targetDistanceMetres,
        targetDurationSeconds: request.targetDurationSeconds,
      });
    } else {
      expect(insertedValues[1]).toMatchObject({
        targetDurationSeconds: request.targetDurationSeconds,
      });
    }
  },
);

function createRepositoryForEdit(
  current: TrainingSession,
  request: EditTrainingSessionRequest,
) {
  const session = {
    ...rows[current.activityType === "RUN" ? 0 : 1].session,
    title: request.title,
    timeOfDay: request.timeOfDay,
    description: request.description,
    sortOrder: request.timeOfDay === current.timeOfDay ? current.sortOrder : 4,
    updatedAt: new Date("2026-08-31T10:00:00.000Z"),
  };
  const runRow = {
    ...rows[0].runDetails!,
    targetDistanceMetres:
      request.activityType === "RUN"
        ? request.targetDistanceMetres
        : rows[0].runDetails!.targetDistanceMetres,
    targetDurationSeconds:
      request.activityType === "RUN"
        ? request.targetDurationSeconds
        : rows[0].runDetails!.targetDurationSeconds,
  };
  const strengthRow = {
    ...rows[1].strengthDetails!,
    targetDurationSeconds:
      "targetDurationSeconds" in request ? request.targetDurationSeconds : null,
  };
  const updateValues: unknown[] = [];
  const update = vi.fn().mockImplementation(() => ({
    set: vi.fn().mockImplementation((values) => {
      updateValues.push(values);
      return {
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              updateValues.length === 1
                ? session
                : request.activityType === "RUN"
                  ? runRow
                  : strengthRow,
            ]),
        }),
      };
    }),
  }));
  const selectWhere = vi.fn().mockResolvedValue([{ nextOrder: "4" }]);
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const select = vi.fn().mockReturnValue({ from: selectFrom });
  const transaction = vi
    .fn()
    .mockImplementation((callback) => callback({ select, update }));
  const transformed = {
    ...current,
    title: request.title,
  } as TrainingSession;
  const transformer: TrainingSessionsTransformer = {
    transform: vi.fn().mockReturnValue(transformed),
  };
  const repository = new DrizzleTrainingSessionsRepository(
    { transaction } as never,
    transformer,
  );

  return {
    repository,
    selectWhere,
    transformed,
    transformer,
    updateValues,
  };
}

test("edits a scheduled run and appends time-bucket moves", async () => {
  const current = transformedRows[0];
  const request = {
    title: "Long easy run",
    description: "Keep it relaxed",
    timeOfDay: "PM",
    activityType: "RUN",
    targetDistanceMetres: 10000,
    targetDurationSeconds: 3600,
  } satisfies EditTrainingSessionRequest;
  const { repository, selectWhere, transformed, transformer, updateValues } =
    createRepositoryForEdit(current, request);

  await expect(repository.edit(current, request)).resolves.toBe(transformed);

  expect(selectWhere).toHaveBeenCalledOnce();
  expect(updateValues).toHaveLength(2);
  expect(updateValues[0]).toEqual({
    title: request.title,
    timeOfDay: request.timeOfDay,
    description: request.description,
    sortOrder: 4,
    updatedAt: expect.any(Date),
  });
  expect(updateValues[1]).toEqual({
    targetDistanceMetres: 10000,
    targetDurationSeconds: 3600,
  });
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ sortOrder: 4 }),
    runDetails: expect.objectContaining({
      targetDistanceMetres: 10000,
      targetDurationSeconds: 3600,
    }),
    strengthDetails: null,
  });
});

test("edits strength common fields without changing strength details or order", async () => {
  const current = transformedRows[1];
  const request = {
    title: "Updated strength",
    description: "Upper body",
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH",
    targetDurationSeconds: current.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;
  const { repository, transformer, updateValues } = createRepositoryForEdit(
    current,
    request,
  );

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(1);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: null,
    strengthDetails: {
      trainingSessionId: current.id,
      targetDurationSeconds: current.targetDurationSeconds,
      actualDurationSeconds: current.actualDurationSeconds,
    },
  });
});

test.each([3600, null])(
  "updates a scheduled strength duration to %s",
  async (targetDurationSeconds) => {
    const current: TrainingSession = {
      ...transformedRows[1],
      status: "SCHEDULED",
    };
    const request = {
      title: current.title,
      description: current.description,
      timeOfDay: current.timeOfDay,
      activityType: "STRENGTH" as const,
      targetDurationSeconds,
    };
    const { repository, transformer, updateValues } = createRepositoryForEdit(
      current,
      request,
    );

    await repository.edit(current, request);

    expect(updateValues[1]).toEqual({ targetDurationSeconds });
    expect(transformer.transform).toHaveBeenCalledOnce();
  },
);

test("updates canonical run target columns", async () => {
  const targets = {
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
    timeOfDay: null,
    request: {
      targetDistanceMetres: 6000,
      targetDurationSeconds: 2400,
    },
    expected: {
      targetDistanceMetres: 6000,
      targetDurationSeconds: 2400,
    },
  } as const;
  const current: TrainingSession = {
    ...transformedRows[0],
    ...targets,
    timeOfDay: "AM",
  };
  const request = {
    title: "Updated run",
    description: null,
    timeOfDay: targets.timeOfDay,
    activityType: "RUN" as const,
    ...targets.request,
  };
  const { repository, updateValues } = createRepositoryForEdit(
    current,
    request,
  );

  await repository.edit(current, request);

  expect(updateValues[1]).toEqual(targets.expected);
});

test("preserves terminal run details while editing common fields", async () => {
  const baseRun = transformedRows[0] as RunTrainingSession;
  const current: typeof baseRun = {
    ...baseRun,
    status: "COMPLETED",
    actualDistanceMetres: 8050,
    actualDurationSeconds: 2680,
  };
  const request = {
    title: "Renamed completed run",
    description: "Felt good",
    timeOfDay: current.timeOfDay,
    activityType: "RUN",
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;
  const { repository, transformer, updateValues } = createRepositoryForEdit(
    current,
    request,
  );

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(1);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: {
      trainingSessionId: current.id,
      targetDistanceMetres: current.targetDistanceMetres,
      targetDurationSeconds: current.targetDurationSeconds,
      actualDistanceMetres: current.actualDistanceMetres,
      actualDurationSeconds: current.actualDurationSeconds,
    },
    strengthDetails: null,
  });
});

test("updates completed run actuals without changing targets", async () => {
  const current: RunTrainingSession = {
    ...(transformedRows[0] as RunTrainingSession),
    status: "COMPLETED",
    actualDistanceMetres: 8050,
    actualDurationSeconds: 2680,
  };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
    actualDistanceMetres: 8100,
    actualDurationSeconds: 2700,
  };
  const { repository, updateValues } = createRepositoryForEdit(current, request);

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(2);
  expect(updateValues[1]).toEqual({
    actualDistanceMetres: request.actualDistanceMetres,
    actualDurationSeconds: request.actualDurationSeconds,
  });
});

test.each([
  { actualDistanceMetres: 8100 },
  { actualDurationSeconds: 2700 },
])("updates one completed run actual metric", async (actuals) => {
  const current: RunTrainingSession = {
    ...(transformedRows[0] as RunTrainingSession),
    status: "COMPLETED",
    actualDistanceMetres: 8050,
    actualDurationSeconds: 2680,
  };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
    ...actuals,
  };
  const { repository, updateValues } = createRepositoryForEdit(current, request);

  await repository.edit(current, request);

  expect(updateValues[1]).toEqual(actuals);
});

test("updates completed strength actual duration without changing its target", async () => {
  const current: TrainingSession = {
    ...transformedRows[1],
    status: "COMPLETED",
    actualDurationSeconds: 1750,
  };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH" as const,
    targetDurationSeconds: current.targetDurationSeconds,
    actualDurationSeconds: 1800,
  };
  const { repository, updateValues } = createRepositoryForEdit(current, request);

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(2);
  expect(updateValues[1]).toEqual({
    actualDurationSeconds: request.actualDurationSeconds,
  });
});

test("rejects mismatched aggregate and request activity types defensively", async () => {
  const current = transformedRows[0];
  const request = {
    title: "Strength",
    description: null,
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
  } satisfies EditTrainingSessionRequest;
  const { repository } = createRepositoryForEdit(current, request);

  await expect(repository.edit(current, request)).rejects.toThrow(
    "Training session activity type changed during edit",
  );
});
