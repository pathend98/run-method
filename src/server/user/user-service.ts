import { createHash, randomBytes } from "node:crypto";

import type { UpdateUserProfile, User } from "@/domain/user-types";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { IdentityAlreadyExistsError, UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import type { VerifiedUserIdentity } from "./user-types";
import {
  GUEST_USER_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from "./user-constants";

export interface UserService {
  findById(id: string): Promise<User>;
  findBySessionKey(sessionKey: string): Promise<User>;
  updateProfile(userId: string, input: UpdateUserProfile): Promise<User>;
  deleteSession(sessionKey: string): Promise<string | null>;
  startGuestSession(): Promise<string>;
  completeIdentitySignIn(
    identity: VerifiedUserIdentity,
    previousSessionKey?: string,
  ): Promise<string>;
}

export class DefaultUserService implements UserService {
  constructor(private readonly repository: UserRepository) {}

  async updateProfile(userId: string, input: UpdateUserProfile): Promise<User> {
    const user = await this.findById(userId);
    if (user.kind !== "REGISTERED") throw new ForbiddenError();
    return this.repository.updateRegisteredProfile(userId, input);
  }

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

  async startGuestSession(): Promise<string> {
    const guest = await this.repository.createGuestUser(
      new Date(Date.now() + GUEST_USER_MAX_AGE_SECONDS * 1000),
    );
    const activeGuest = await this.repository.findById(guest.id);
    if (activeGuest?.kind !== "GUEST") throw new UserNotFoundError();
    return this.persistSession(activeGuest.id, null, null, null);
  }

  async completeIdentitySignIn(
    identity: VerifiedUserIdentity,
    previousSessionKey?: string,
  ): Promise<string> {
    let previousUser: User | null = null;
    if (previousSessionKey) {
      try {
        previousUser = await this.findBySessionKey(previousSessionKey);
      } catch (error) {
        if (!(error instanceof UserNotFoundError)) throw error;
      }
      await this.deleteSession(previousSessionKey);
    }

    const { issuer, subject, email } = identity;
    const existingUser = await this.repository.findByIdentity({
      issuer,
      subject,
    });
    if (previousUser?.kind === "GUEST") {
      if (existingUser) {
        await this.repository.deleteGuestUser(previousUser.id);
      } else {
        try {
          await this.repository.promoteGuestUser(previousUser.id, {
            issuer,
            subject,
            email,
          });
        } catch (error) {
          if (!(error instanceof IdentityAlreadyExistsError)) throw error;
          const claimedUser = await this.repository.findByIdentity({
            issuer,
            subject,
          });
          if (!claimedUser) throw new UserNotFoundError();
          await this.repository.deleteGuestUser(previousUser.id);
        }
      }
    } else if (!existingUser) {
      await this.repository.create({ issuer, subject, email });
    }

    const registeredUser = await this.repository.findByIdentity({
      issuer,
      subject,
    });
    if (registeredUser?.kind !== "REGISTERED") throw new UserNotFoundError();
    return this.persistSession(
      registeredUser.id,
      identity.accessToken,
      identity.idToken,
      identity.refreshToken,
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
