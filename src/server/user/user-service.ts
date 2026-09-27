import { createHash, randomBytes } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import type { CreateUser, CreateUserSession, UserIdentity } from "./user-types";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface UserService {
  findById(id: string): Promise<User>;
  findByIdentity(identity: UserIdentity): Promise<User>;
  findBySessionKey(sessionKey: string): Promise<User>;
  create(input: CreateUser): Promise<User>;
  createSession(input: CreateUserSession): Promise<string>;
  deleteSession(sessionKey: string): Promise<string | null>;
}

export class DefaultUserService implements UserService {
  constructor(private readonly repository: UserRepository) {}

  async deleteSession(sessionKey: string): Promise<string | null> {
    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");
    return this.repository.deleteSessionBySessionKeyHash(sessionKeyHash);
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  async findByIdentity(identity: UserIdentity): Promise<User> {
    const user = await this.repository.findByIdentity(identity);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  async findBySessionKey(sessionKey: string): Promise<User> {
    if (!sessionKey) throw new UserNotFoundError();

    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");
    const user = await this.repository.findBySessionKeyHash(
      sessionKeyHash,
      new Date(),
    );
    if (!user) throw new UserNotFoundError();
    return user;
  }

  create(input: CreateUser): Promise<User> {
    return this.repository.create(input);
  }

  async createSession(input: CreateUserSession): Promise<string> {
    const identity = await this.repository.findByIdentity(input);
    if (!identity) {
      throw new UserNotFoundError();
    }

    const sessionKey = randomBytes(32).toString("base64url");
    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");

    await this.repository.createSession({
      sessionKeyHash,
      userId: identity.id,
      accessToken: input.accessToken,
      idToken: input.idToken,
      refreshToken: input.refreshToken,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    });

    return sessionKey;
  }
}
