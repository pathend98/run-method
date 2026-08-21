import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";

test("findBetweenDates maps rows and applies deterministic ordering", async () => {
  const orderBy = vi.fn().mockResolvedValue([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Mobility",
      activityType: "Recovery",
      date: "2026-08-17",
      timeOfDay: null,
      description: "Stretch",
      sortOrder: 1,
    },
  ]);
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  const repository = new DrizzleTrainingSessionsRepository({
    select,
  } as never);

  await expect(
    repository.findBetweenDates("2026-08-17", "2026-08-23"),
  ).resolves.toEqual([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Mobility",
      activityType: "Recovery",
      date: "2026-08-17",
      timeOfDay: null,
      description: "Stretch",
      sortOrder: 1,
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
