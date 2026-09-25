import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";
import { UserNotFoundError } from "@/server/user/user-errors";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";

  try {
    if (sessionKey) await getUserService().findBySessionKey(sessionKey);
    const destination = sessionKey ? "/training-planner" : "/auth";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500 },
    );
  }
}
