import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";

  try {
    const user = sessionKey
      ? await getUserService().findBySessionKey(sessionKey)
      : null;
    const destination = user ? "/training-planner" : "/auth";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500 },
    );
  }
}
