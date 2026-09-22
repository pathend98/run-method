import { NextResponse } from "next/server";

import { getOidcLoginService } from "@/server/server";

const OIDC_TRANSACTION_COOKIE = "run_method_oidc_transaction";
const OIDC_TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

export const runtime = "nodejs";

export function GET() {
  try {
    const login = getOidcLoginService().createLogin();
    const response = NextResponse.redirect(login.authorizationUrl, 302);

    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(OIDC_TRANSACTION_COOKIE, login.transaction, {
      httpOnly: true,
      sameSite: "lax",
      path: login.callbackPath,
      maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
      secure: login.secureCookie,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to start sign in" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
