import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COOKIE_OPTIONS,
  OIDC_TRANSACTION_COOKIE_NAME,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { getAuthenticationService, getUserService } from "@/server/server";
import { SESSION_MAX_AGE_SECONDS } from "@/server/user/user-service";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const transactionCookieValue =
    request.cookies.get(OIDC_TRANSACTION_COOKIE_NAME)?.value ?? "";

  let response: NextResponse;
  try {
    if (!code || !state || !transactionCookieValue) {
      throw new AuthenticationCallbackError("Invalid authorization callback");
    }

    const identity = await getAuthenticationService().exchangeAuthorizationCode(
      {
        code,
        state,
        transactionCookieValue,
      },
    );
    const userService = getUserService();
    const { issuer, subject, email, accessToken, idToken, refreshToken } =
      identity;
    await userService.create({ issuer, subject, email });
    const sessionKey = await userService.createSession({
      issuer,
      subject,
      accessToken,
      idToken,
      refreshToken,
    });

    response = new NextResponse(null, {
      status: 307,
      headers: { location: "/" },
    });
    response.cookies.set(USER_SESSION_COOKIE_NAME, sessionKey, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch (error) {
    if (error instanceof AuthenticationCallbackError) {
      response = NextResponse.json(
        { error: "Invalid authorization callback" },
        { status: 400 },
      );
    } else if (
      error instanceof AuthenticationTokenExchangeError ||
      error instanceof AuthenticationIdTokenVerificationError
    ) {
      response = NextResponse.json(
        { error: "Unable to complete authentication" },
        { status: 502 },
      );
    } else {
      response = NextResponse.json(
        { error: "Unable to complete authentication" },
        { status: 500 },
      );
    }
  }

  response.cookies.set(OIDC_TRANSACTION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}
