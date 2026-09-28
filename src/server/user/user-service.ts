import { createHash, randomBytes } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import type { CreateUser, CreateUserSession, UserIdentity } from "./user-types";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const GUEST_USER_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface UserService {
  findById(id: string): Promise<User>;
  findByIdentity(identity: UserIdentity): Promise<User>;
  findBySessionKey(sessionKey: string): Promise<User>;
  create(input: CreateUser): Promise<User>;
  createGuestUser(): Promise<User>;
  createSession(input: CreateUserSession): Promise<string>;
  createGuestUserSession(userId: string): Promise<string>;
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

  createGuestUser(): Promise<User> {
    return this.repository.createGuestUser(
      new Date(Date.now() + GUEST_USER_MAX_AGE_SECONDS * 1000),
    );
  }

  async createGuestUserSession(userId: string): Promise<string> {
    const user = await this.repository.findById(userId);
    if (user?.kind !== "GUEST") throw new UserNotFoundError();
    return this.persistSession(user.id, null, null, null);
  }

  async createSession(input: CreateUserSession): Promise<string> {
    const identity = await this.repository.findByIdentity(input);
    if (identity?.kind !== "REGISTERED") {
      throw new UserNotFoundError();
    }

    return this.persistSession(
      identity.id,
      input.accessToken,
      input.idToken,
      input.refreshToken,
    );
  }

  private async persistSession(
    userId: string,
    accessToken: string | null,
    idToken: string | null,
    refreshToken: string | null,
  ): Promise<string> {
    const sessionKey = randomBytes(32).toString("base64url");
    const sessionKeyHash = createHash("sha256")
      .update(sessionKey)
      .digest("hex");

    await this.repository.createSession({
      sessionKeyHash,
      userId,
      accessToken,
      idToken,
      refreshToken,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    });

    return sessionKey;
  }
}
