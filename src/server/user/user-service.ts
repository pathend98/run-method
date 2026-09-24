import type { User } from "@/domain/user";
import type { UserRepository } from "./user-repository";

export type UserIdentity = {
  issuer: string;
  subject: string;
};

export type CreateUser = UserIdentity & {
  email: string;
};

export interface UserService {
  findByIdentity(identity: UserIdentity): Promise<User | null>;
  create(input: CreateUser): Promise<User>;
}

export class DefaultUserService implements UserService {
  constructor(private readonly repository: UserRepository) {}

  findByIdentity(identity: UserIdentity): Promise<User | null> {
    return this.repository.findByIdentity(identity);
  }

  create(input: CreateUser): Promise<User> {
    return this.repository.create(input);
  }
}
