import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  COOKIE_OPTIONS,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;

  try {
    if (sessionKey) await getUserService().deleteSession(sessionKey);
  } catch {
    // Clear the browser session even when database deletion fails.
  }

  const response = new NextResponse(null, {
    status: 307,
    headers: { location: "/", "Cache-Control": "no-store" },
  });
  response.cookies.set(USER_SESSION_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
