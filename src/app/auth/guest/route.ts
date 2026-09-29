import { NextResponse } from "next/server";

import {
  COOKIE_OPTIONS,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { readAppEnv } from "@/server/env/app-env";
import { getUserService } from "@/server/server";
import { SESSION_MAX_AGE_SECONDS } from "@/server/user/user-constants";

export async function GET() {
  try {
    const sessionKey = await getUserService().startGuestSession();
    const response = NextResponse.redirect(
      new URL("/", readAppEnv().APP_BASE_URL),
    );
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(USER_SESSION_COOKIE_NAME, sessionKey, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to complete authentication" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
