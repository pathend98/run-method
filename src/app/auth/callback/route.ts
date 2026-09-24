import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COOKIE_OPTIONS,
  OIDC_TOKEN_COOKIE_NAME,
  OIDC_TRANSACTION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { getAuthenticationService } from "@/server/server";

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

    response = new NextResponse(null, {
      status: 307,
      headers: { location: "/" },
    });
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
