import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_OPTIONS,
  OIDC_TRANSACTION_COOKIE_NAME,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { AuthenticationCallbackError } from "@/server/authentication/authentication-errors";
import { readAppEnv } from "@/server/env/app-env";
import { withApiHandler } from "@/server/http/with-api-handler";
import { getAuthenticationService, getUserService } from "@/server/server";
import { SESSION_MAX_AGE_SECONDS } from "@/server/user/user-constants";

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
  const sessionKey = await getUserService().completeIdentitySignIn(
    identity,
    request.cookies.get(USER_SESSION_COOKIE_NAME)?.value,
  );

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
