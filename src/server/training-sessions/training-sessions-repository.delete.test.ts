import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

const id = "11111111-1111-4111-8111-111111111111";

function createRepository(result: { id: string }[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ returning });
  const deleteSession = vi.fn().mockReturnValue({ where });
  const transformer: TrainingSessionsTransformer = { transform: vi.fn() };
  const repository = new DrizzleTrainingSessionsRepository(
    { delete: deleteSession } as never,
    transformer,
  );

  return { deleteSession, repository, returning, where };
}

test("deleteById returns true when a training session is deleted", async () => {
  const { deleteSession, repository, returning, where } = createRepository([
    { id },
  ]);

  await expect(repository.deleteById(id)).resolves.toBe(true);
  expect(deleteSession).toHaveBeenCalledWith(expect.anything());
  expect(where).toHaveBeenCalledOnce();
  expect(returning).toHaveBeenCalledWith({ id: expect.anything() });
});

test("deleteById returns false when no training session exists", async () => {
  const { repository } = createRepository([]);

  await expect(repository.deleteById(id)).resolves.toBe(false);
});
