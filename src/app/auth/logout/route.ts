import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COOKIE_OPTIONS,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { getLogoutUrlStrategy, getUserService } from "@/server/server";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;

  let idToken: string | null = null;
  try {
    if (sessionKey) idToken = await getUserService().deleteSession(sessionKey);
  } catch {
    // Clear the browser session even when database deletion fails.
  }

  const response = new NextResponse(null, {
    status: 307,
    headers: {
      location: getLogoutUrlStrategy().createLogoutUrl(idToken ?? undefined)
        .href,
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set(USER_SESSION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
