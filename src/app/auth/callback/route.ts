import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { User } from "@/domain/user-types";

import {
  COOKIE_OPTIONS,
  OIDC_TRANSACTION_COOKIE_NAME,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { AuthenticationCallbackError } from "@/server/authentication/authentication-errors";
import type { AuthenticatedIdentity } from "@/server/authentication/authentication-service";
import { readAppEnv } from "@/server/env/app-env";
import { withApiHandler } from "@/server/http/with-api-handler";
import { getAuthenticationService, getUserService } from "@/server/server";
import { SESSION_MAX_AGE_SECONDS } from "@/server/user/user-constants";
import {
  IdentityAlreadyExistsError,
  UserNotFoundError,
} from "@/server/user/user-errors";

async function findOrNull(find: () => Promise<User>): Promise<User | null> {
  try {
    return await find();
  } catch (error) {
    if (error instanceof UserNotFoundError) return null;
    throw error;
  }
}

async function reconcileUserSession(
  request: NextRequest,
  identity: AuthenticatedIdentity,
): Promise<void> {
  const userService = getUserService();
  const { issuer, subject, email } = identity;
  const oldSessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
  let previousUser: User | null = null;
  if (oldSessionKey) {
    previousUser = await findOrNull(() =>
      userService.findBySessionKey(oldSessionKey),
    );
    await userService.deleteSession(oldSessionKey);
  }

  const existingUser = await findOrNull(() =>
    userService.findByIdentity({ issuer, subject }),
  );
  if (previousUser?.kind === "GUEST") {
    if (existingUser) {
      await userService.deleteGuestUser(previousUser.id);
    } else {
      try {
        await userService.promoteGuestUser(previousUser.id, {
          issuer,
          subject,
          email,
        });
      } catch (error) {
        if (!(error instanceof IdentityAlreadyExistsError)) throw error;
        await userService.findByIdentity({ issuer, subject });
        await userService.deleteGuestUser(previousUser.id);
      }
    }
  } else if (!existingUser) {
    await userService.create({ issuer, subject, email });
  }
}

const handleCallback = withApiHandler(async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const transactionCookieValue =
    request.cookies.get(OIDC_TRANSACTION_COOKIE_NAME)?.value ?? "";
  if (!code || !state || !transactionCookieValue) {
    throw new AuthenticationCallbackError("Invalid authorization callback");
  }

  const identity = await getAuthenticationService().exchangeAuthorizationCode({
    code,
    state,
    transactionCookieValue,
  });
  await reconcileUserSession(request, identity);

  const { issuer, subject, accessToken, idToken, refreshToken } = identity;
  const userService = getUserService();
  const sessionKey = await userService.createSession({
    issuer,
    subject,
    accessToken,
    idToken,
    refreshToken,
  });

  const response = NextResponse.redirect(
    new URL("/", readAppEnv().APP_BASE_URL),
  );
  response.cookies.set(USER_SESSION_COOKIE_NAME, sessionKey, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}, "Unable to complete authentication");

export async function GET(request: NextRequest) {
  const response = await handleCallback(request);
  response.cookies.set(OIDC_TRANSACTION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
