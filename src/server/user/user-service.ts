import { createHash, randomBytes } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserIdentityNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import type { CreateUser, CreateUserSession, UserIdentity } from "./user-types";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface UserService {
  findByIdentity(identity: UserIdentity): Promise<User | null>;
  create(input: CreateUser): Promise<User>;
  createSession(input: CreateUserSession): Promise<string>;
}

export class DefaultUserService implements UserService {
  constructor(private readonly repository: UserRepository) {}

  findByIdentity(identity: UserIdentity): Promise<User | null> {
    return this.repository.findByIdentity(identity);
  }

  create(input: CreateUser): Promise<User> {
    return this.repository.create(input);
  }

  async createSession(input: CreateUserSession): Promise<string> {
    const identity = await this.repository.findByIdentity(input);
    if (!identity) {
      throw new UserIdentityNotFoundError("User identity not found");
    }

    const sessionKey = randomBytes(32).toString("base64url");
    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");

    await this.repository.createSession({
      sessionKeyHash,
      issuer: input.issuer,
      subject: input.subject,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
    });

    return sessionKey;
  }
}
