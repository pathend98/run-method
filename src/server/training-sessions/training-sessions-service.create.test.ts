import { createStrengthActivity } from "@/test-support/fixtures/activity";
import type { CreateTrainingSessionInput } from "./training-sessions-service";
import { DefaultTrainingSessionsService } from "./training-sessions-service";
import { UserNotFoundError } from "../user/user-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";
import { createUser } from "@/test-support/fixtures/user";

const athleteId = "33333333-3333-4333-8333-333333333333";
const request: CreateTrainingSessionInput = {
  title: "Strength",
  activityType: "STRENGTH",
  date: "2026-08-26",
  timeOfDay: null,
  description: null,
  targetDurationSeconds: null,
  athleteId,
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

test.each([undefined, null, "invalid"])(
  "validates athlete id %s before looking up users",
  async (athleteId) => {
    const { repository, service, userService } = createService();

    await expect(
      service.create(athleteId as string, athleteId as string, () => request),
    ).rejects.toThrow("athlete id must be a valid UUID");
    expect(userService.findById).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  },
);

test("checks the athlete before creating a session", async () => {
  const { repository, service, userService } = createService();
  vi.mocked(userService.findById).mockResolvedValue(
    createUser({
      id: athleteId,
    }),
  );
  vi.mocked(repository.create).mockResolvedValue({ id: "created" } as never);

  await service.create(athleteId, athleteId, () => request);

  expect(userService.findById).toHaveBeenCalledExactlyOnceWith(athleteId);
  expect(repository.create).toHaveBeenCalledExactlyOnceWith(request);
  expect(
    vi.mocked(userService.findById).mock.invocationCallOrder[0],
  ).toBeLessThan(vi.mocked(repository.create).mock.invocationCallOrder[0]);
});

test("does not create a session when the athlete is missing", async () => {
  const { repository, service, userService } = createService();
  vi.mocked(userService.findById).mockRejectedValue(new UserNotFoundError());

  await expect(
    service.create(athleteId, athleteId, () => request),
  ).rejects.toThrow(UserNotFoundError);
  expect(repository.create).not.toHaveBeenCalled();
});

test("delegates creation to the repository", async () => {
  const { repository, service, userService } = createService();
  const request = {
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: "Strength",
    activityType: "STRENGTH" as const,
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: 1800,
  };
  const created = createStrengthActivity({
    date: request.date,
    targetDurationSeconds: request.targetDurationSeconds,
    createdAt: "2026-08-26T10:00:00.000Z",
    updatedAt: "2026-08-26T10:00:00.000Z",
  });
  vi.mocked(repository.create).mockResolvedValue(created);

  await expect(
    service.create(athleteId, request.athleteId, () => request),
  ).resolves.toEqual(created);
  expect(userService.findById).toHaveBeenCalledWith(request.athleteId);
  expect(repository.create).toHaveBeenCalledWith(request);
});
