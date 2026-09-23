import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  OIDC_TOKEN_COOKIE_NAME,
  OIDC_TRANSACTION_COOKIE_NAME,
} from "@/server/authentication/authentication-service";
import {
  AuthenticationCallbackError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { getAuthenticationService } from "@/server/server";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

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

    const tokenCookieValue =
      await getAuthenticationService().exchangeAuthorizationCode({
        code,
        state,
        transactionCookieValue,
      });

    response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(
      OIDC_TOKEN_COOKIE_NAME,
      tokenCookieValue,
      COOKIE_OPTIONS,
    );
  } catch (error) {
    if (error instanceof AuthenticationCallbackError) {
      response = NextResponse.json(
        { error: "Invalid authorization callback" },
        { status: 400 },
      );
    } else if (error instanceof AuthenticationTokenExchangeError) {
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
