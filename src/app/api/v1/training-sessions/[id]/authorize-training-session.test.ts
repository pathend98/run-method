import { ForbiddenError } from "@/server/errors/forbidden-error";
import { TrainingSessionNotFoundError } from "@/server/training-sessions/training-sessions-errors";
import { authorizeTrainingSession } from "./authorize-training-session";

const service = vi.hoisted(() => ({ findById: vi.fn() }));
vi.mock("@/server/server", () => ({
  getTrainingSessionsService: () => service,
}));

const id = "11111111-1111-4111-8111-111111111111";

beforeEach(() => vi.clearAllMocks());

test("allows the athlete who owns the session", async () => {
  service.findById.mockResolvedValue({ id, athleteId: "athlete-id" });
  await expect(
    authorizeTrainingSession("athlete-id", id),
  ).resolves.toBeUndefined();
  expect(service.findById).toHaveBeenCalledWith(id);
});

test("forbids another athlete", async () => {
  service.findById.mockResolvedValue({ id, athleteId: "athlete-id" });
  await expect(authorizeTrainingSession("other-id", id)).rejects.toThrow(
    ForbiddenError,
  );
});

test("propagates lookup errors", async () => {
  const missing = new TrainingSessionNotFoundError();
  service.findById.mockRejectedValue(missing);
  await expect(authorizeTrainingSession("athlete-id", id)).rejects.toBe(
    missing,
  );
});
