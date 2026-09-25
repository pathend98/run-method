import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";
import { UserNotFoundError } from "@/server/user/user-errors";

function redirectTo(destination: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { location: destination },
  });
}

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";

  try {
    if (sessionKey) await getUserService().findBySessionKey(sessionKey);
    const destination = sessionKey ? "/training-planner" : "/auth";
    return redirectTo(destination);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return redirectTo("/auth");
    }
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500 },
    );
  }
}
