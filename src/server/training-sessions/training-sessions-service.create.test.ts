import type { CreateTrainingSessionInput } from "./training-sessions-service";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import { AthleteNotFoundError } from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

const userId = "33333333-3333-4333-8333-333333333333";
const request: CreateTrainingSessionInput = {
  title: "Strength",
  activityType: "STRENGTH",
  date: "2026-08-26",
  timeOfDay: null,
  description: null,
  targetDurationSeconds: null,
  userId,
};

function createService() {
  const repository = {
    create: vi.fn(),
  } as unknown as TrainingSessionsRepository;
  const userService = { findById: vi.fn() } as unknown as UserService;
  const service = new DefaultTrainingSessionsService(
    repository,
    {} as TrainingSessionsValidator,
    userService,
  );
  return { repository, userService, service };
}

test("validates athlete ids before looking up users", async () => {
  const { repository, service, userService } = createService();

  await expect(
    service.create({ ...request, userId: "invalid" }),
  ).rejects.toThrow("athlete id must be a valid UUID");
  expect(userService.findById).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test("checks the athlete before creating a session", async () => {
  const { repository, service, userService } = createService();
  vi.mocked(userService.findById).mockResolvedValue({ id: userId });
  vi.mocked(repository.create).mockResolvedValue({ id: "created" } as never);

  await service.create(request);

  expect(userService.findById).toHaveBeenCalledExactlyOnceWith(userId);
  expect(repository.create).toHaveBeenCalledExactlyOnceWith(request);
  expect(
    vi.mocked(userService.findById).mock.invocationCallOrder[0],
  ).toBeLessThan(vi.mocked(repository.create).mock.invocationCallOrder[0]);
});

test("does not create a session when the athlete is missing", async () => {
  const { repository, service, userService } = createService();
  vi.mocked(userService.findById).mockResolvedValue(null);

  await expect(service.create(request)).rejects.toThrow(AthleteNotFoundError);
  expect(repository.create).not.toHaveBeenCalled();
});
