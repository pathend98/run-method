import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { TrainingSessionNotFoundError } from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

const actorId = createRunTrainingSession().athleteId;

const id = "11111111-1111-4111-8111-111111111111";

function createService() {
  const repository = {
    findById: vi.fn(),
  } as unknown as TrainingSessionsRepository;
  const service = new DefaultTrainingSessionsService(
    repository,
    {} as TrainingSessionsValidator,
    {} as UserService,
  );
  return { repository, service };
}

test("finds a training session by a valid id", async () => {
  const { repository, service } = createService();
  const session = createRunTrainingSession({ id });
  vi.mocked(repository.findById).mockResolvedValue(session);

  await expect(service.findById(actorId, id)).resolves.toBe(session);
  expect(repository.findById).toHaveBeenCalledExactlyOnceWith(id);
});

test("propagates lookup failures and reports missing sessions", async () => {
  const { repository, service } = createService();
  const failure = new Error("Invalid database identifier");
  vi.mocked(repository.findById).mockRejectedValue(failure);
  await expect(service.findById(actorId, "invalid")).rejects.toBe(failure);
  expect(repository.findById).toHaveBeenCalledExactlyOnceWith("invalid");

  vi.mocked(repository.findById).mockResolvedValue(null);
  await expect(service.findById(actorId, id)).rejects.toThrow(
    TrainingSessionNotFoundError,
  );
});
