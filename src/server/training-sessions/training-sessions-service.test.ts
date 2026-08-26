import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type { TrainingSessionsRepository } from "./training-sessions-repository";

function createService() {
  const repository: TrainingSessionsRepository = {
    findBetweenDates: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  };

  return {
    repository,
    service: new DefaultTrainingSessionsService(repository),
  };
}

test("requires from and to dates", async () => {
  const { service } = createService();

  await expect(service.findBetweenDates(null, "2026-08-23")).rejects.toThrow(
    "from and to query parameters are required",
  );
});

test("rejects invalid date strings", async () => {
  const { service } = createService();

  await expect(
    service.findBetweenDates("2026-02-30", "2026-08-23"),
  ).rejects.toThrow("from and to must be valid dates in YYYY-MM-DD format");
});

test("rejects inverted and oversized ranges", async () => {
  const { service } = createService();

  await expect(
    service.findBetweenDates("2026-08-24", "2026-08-23"),
  ).rejects.toThrow("from must be before or equal to to");
  await expect(
    service.findBetweenDates("2026-08-01", "2026-09-02"),
  ).rejects.toThrow("date range must not exceed 31 days");
});

test("delegates valid ranges to the repository", async () => {
  const { repository, service } = createService();

  await expect(
    service.findBetweenDates("2026-08-17", "2026-08-23"),
  ).resolves.toEqual([]);
  expect(repository.findBetweenDates).toHaveBeenCalledWith(
    "2026-08-17",
    "2026-08-23",
  );
});
