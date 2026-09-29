import type { User } from "@/domain/user-types";

const baseUser: User = {
  id: "user-id",
  kind: "REGISTERED",
  expiresAt: null,
  firstName: null,
  measurementUnit: "KILOMETRES",
};

export function createUser(overrides: Partial<User> = {}): User {
  return { ...baseUser, ...overrides };
}
