import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";

export async function proxy(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";
  if (!sessionKey) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  try {
    const user = await getUserService().findBySessionKey(sessionKey);
    return user
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/auth", request.url));
  } catch {
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: "/training-planner",
};
