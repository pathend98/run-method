import { and, eq, gt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { userIdentities, userSessions, users } from "@db/schema";
import type { User } from "@/domain/user-types";
import { IdentityAlreadyExistsError } from "./user-errors";
import type {
  CreateUser,
  CreateUserSessionRecord,
  UserIdentity,
} from "./user-types";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIdentity(identity: UserIdentity): Promise<User | null>;
  findBySessionKeyHash(sessionKeyHash: string, now: Date): Promise<User | null>;
  create(input: CreateUser): Promise<User>;
  createSession(input: CreateUserSessionRecord): Promise<void>;
  deleteSessionBySessionKeyHash(sessionKeyHash: string): Promise<string | null>;
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async deleteSessionBySessionKeyHash(
    sessionKeyHash: string,
  ): Promise<string | null> {
    const [session] = await this.db
      .delete(userSessions)
      .where(eq(userSessions.sessionKeyHash, sessionKeyHash))
      .returning({ idToken: userSessions.idToken });
    return session?.idToken ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async findByIdentity(identity: UserIdentity): Promise<User | null> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(userIdentities)
      .innerJoin(users, eq(userIdentities.userId, users.id))
      .where(
        and(
          eq(userIdentities.issuer, identity.issuer),
          eq(userIdentities.subject, identity.subject),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async findBySessionKeyHash(
    sessionKeyHash: string,
    now: Date,
  ): Promise<User | null> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(
        and(
          eq(userSessions.sessionKeyHash, sessionKeyHash),
          gt(userSessions.expiresAt, now),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async create(input: CreateUser): Promise<User> {
    try {
      return await this.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({})
          .returning({ id: users.id });
        const [identity] = await tx
          .insert(userIdentities)
          .values({
            userId: user.id,
            issuer: input.issuer,
            subject: input.subject,
            email: input.email,
          })
          .onConflictDoNothing({
            target: [userIdentities.issuer, userIdentities.subject],
          })
          .returning({ userId: userIdentities.userId });

        if (!identity) throw new IdentityAlreadyExistsError();
        return user;
      });
    } catch (error) {
      if (!(error instanceof IdentityAlreadyExistsError)) throw error;

      const existing = await this.findByIdentity(input);
      if (!existing) throw error;
      return existing;
    }
  }

  async createSession(input: CreateUserSessionRecord): Promise<void> {
    await this.db.insert(userSessions).values(input);
  }
}
