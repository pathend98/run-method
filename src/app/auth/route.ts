import { NextResponse } from "next/server";

import { OIDC_TRANSACTION_COOKIE_NAME } from "@/server/authentication/authentication-service";
import { getAuthenticationService } from "@/server/server";

const OIDC_TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

export function GET() {
  const { authorizationUrl, transactionCookieValue } =
    getAuthenticationService().createAuthorizationRedirect();

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(OIDC_TRANSACTION_COOKIE_NAME, transactionCookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
  });

  return response;
}
