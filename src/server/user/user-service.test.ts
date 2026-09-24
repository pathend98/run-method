import type { User } from "@/domain/user";
import type { UserRepository } from "./user-repository";
import { DefaultUserService } from "./user-service";

test("finds a user by issuer and subject", async () => {
  const user: User = { id: "11111111-1111-4111-8111-111111111111" };
  const repository: UserRepository = {
    findByIdentity: vi.fn().mockResolvedValue(user),
    create: vi.fn(),
  };
  const service = new DefaultUserService(repository);
  const identity = { issuer: "https://issuer.example", subject: "subject-1" };

  await expect(service.findByIdentity(identity)).resolves.toBe(user);
  expect(repository.findByIdentity).toHaveBeenCalledWith(identity);
});

test("creates a user from an identity and email", async () => {
  const user: User = { id: "11111111-1111-4111-8111-111111111111" };
  const repository: UserRepository = {
    findByIdentity: vi.fn(),
    create: vi.fn().mockResolvedValue(user),
  };
  const service = new DefaultUserService(repository);
  const input = {
    issuer: "https://issuer.example",
    subject: "subject-1",
    email: "runner@example.com",
  };

  await expect(service.create(input)).resolves.toBe(user);
  expect(repository.create).toHaveBeenCalledWith(input);
});
