import type { TrainingSession } from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

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
  const session = {
    id,
    athleteId: "33333333-3333-4333-8333-333333333333",
  } as TrainingSession;
  vi.mocked(repository.findById).mockResolvedValue(session);

  await expect(service.findById(id)).resolves.toBe(session);
  expect(repository.findById).toHaveBeenCalledExactlyOnceWith(id);
});

test("rejects invalid and missing training session ids during lookup", async () => {
  const { repository, service } = createService();
  await expect(service.findById("invalid")).rejects.toThrow(
    TrainingSessionsValidationError,
  );
  expect(repository.findById).not.toHaveBeenCalled();

  vi.mocked(repository.findById).mockResolvedValue(null);
  await expect(service.findById(id)).rejects.toThrow(
    TrainingSessionNotFoundError,
  );
});
