import { NextResponse } from "next/server";

import {
  COOKIE_OPTIONS,
  OIDC_TRANSACTION_COOKIE_NAME,
  OIDC_TRANSACTION_MAX_AGE_SECONDS,
} from "@/server/authentication/authentication-constants";
import { getAuthenticationService } from "@/server/server";

export function GET() {
  const { authorizationUrl, transactionCookieValue } =
    getAuthenticationService().createAuthorizationRedirect();

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(OIDC_TRANSACTION_COOKIE_NAME, transactionCookieValue, {
    ...COOKIE_OPTIONS,
    maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
  });

  return response;
}
