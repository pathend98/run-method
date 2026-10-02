import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  apiHandler,
  getLogoutUrlStrategy,
  getUserService,
} from "@/server/server";
import { noStoreResponseHeaders } from "@/server/http/api-handler";
import {
  COOKIE_OPTIONS,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";

const handleLogout = apiHandler.wrap(
  async (request: NextRequest) => {
    const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;

    let idToken: string | null = null;
    try {
      if (sessionKey)
        idToken = await getUserService().deleteSession(sessionKey);
    } catch {
      // Clear the browser session even when database deletion fails.
    }

    const logoutUrl = getLogoutUrlStrategy().createLogoutUrl(
      idToken ?? undefined,
    );
    const response = NextResponse.redirect(logoutUrl);
    response.headers.set(
      "Cache-Control",
      noStoreResponseHeaders["Cache-Control"],
    );
    return response;
  },
  "Unable to complete logout",
  noStoreResponseHeaders,
);

export async function GET(request: NextRequest) {
  const response = await handleLogout(request);
  response.cookies.set(USER_SESSION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
