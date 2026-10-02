import { NextResponse } from "next/server";

import { apiHandler, getAuthenticationService } from "@/server/server";
import { noStoreResponseHeaders } from "@/server/http/api-handler";
import {
  COOKIE_OPTIONS,
  OIDC_TRANSACTION_COOKIE_NAME,
  OIDC_TRANSACTION_MAX_AGE_SECONDS,
} from "@/server/authentication/authentication-constants";

export const GET = apiHandler.wrap(
  () => {
    const { authorizationUrl, transactionCookieValue } =
      getAuthenticationService().createAuthorizationRedirect();

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(OIDC_TRANSACTION_COOKIE_NAME, transactionCookieValue, {
      ...COOKIE_OPTIONS,
      maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
    });

    return response;
  },
  "Unable to complete authentication",
  noStoreResponseHeaders,
);
