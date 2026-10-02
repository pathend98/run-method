import type { NextRequest } from "next/server";
import type { User } from "@/domain/user-types";
import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import type { UserService } from "@/server/user/user-service";

export interface RequestAuthenticationService {
  authenticateActor(request: NextRequest): Promise<string>;
  authenticateUser(request: NextRequest): Promise<User>;
}

export class DefaultRequestAuthenticationService implements RequestAuthenticationService {
  constructor(
    private readonly getUserService: () => Pick<
      UserService,
      "findBySessionKey"
    >,
  ) {}

  async authenticateActor(request: NextRequest): Promise<string> {
    return (await this.authenticateUser(request)).id;
  }

  async authenticateUser(request: NextRequest): Promise<User> {
    const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
    if (!sessionKey) throw new UnauthorizedError();

    try {
      return await this.getUserService().findBySessionKey(sessionKey);
    } catch (error) {
      if (error instanceof NotFoundError) throw new UnauthorizedError();
      throw new AuthenticationLookupError();
    }
  }
}
