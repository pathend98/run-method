import type { NextRequest } from "next/server";
import type { User } from "@/domain/user-types";
import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { getUserService } from "@/server/server";

export const privateResponseHeaders = { "Cache-Control": "private, no-store" };

export async function authenticateActor(request: NextRequest): Promise<string> {
  return (await authenticateUser(request)).id;
}

export async function authenticateUser(request: NextRequest): Promise<User> {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
  if (!sessionKey) throw new UnauthorizedError();

  try {
    return await getUserService().findBySessionKey(sessionKey);
  } catch (error) {
    if (error instanceof NotFoundError) throw new UnauthorizedError();
    throw new AuthenticationLookupError();
  }
}

export function authorizeAthlete(actorId: string, athleteId: string): void {
  if (actorId !== athleteId) throw new ForbiddenError();
}
