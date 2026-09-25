import { createHash, randomBytes } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserIdentityNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import type { CreateUser, CreateUserSession, UserIdentity } from "./user-types";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface UserService {
  findById(id: string): Promise<User | null>;
  findByIdentity(identity: UserIdentity): Promise<User | null>;
  findBySessionKey(sessionKey: string): Promise<User | null>;
  create(input: CreateUser): Promise<User>;
  createSession(input: CreateUserSession): Promise<string>;
}

export class DefaultUserService implements UserService {
  constructor(private readonly repository: UserRepository) {}

  findById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }

  findByIdentity(identity: UserIdentity): Promise<User | null> {
    return this.repository.findByIdentity(identity);
  }

  findBySessionKey(sessionKey: string): Promise<User | null> {
    if (!sessionKey) return Promise.resolve(null);

    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");
    return this.repository.findBySessionKeyHash(sessionKeyHash, new Date());
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
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    });

    return sessionKey;
  }
}
