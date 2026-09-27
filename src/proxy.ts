import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { readAuthenticationEnv } from "@/server/env/authentication-env";
import { getUserService } from "@/server/server";
import { UserNotFoundError } from "@/server/user/user-errors";

function redirectToApp(path: string) {
  // Use the logout callback until a dedicated app base URL is configured.
  const baseUrl = readAuthenticationEnv().OIDC_LOGOUT_CALLBACK_URL;
  return NextResponse.redirect(new URL(path, baseUrl));
}

export async function proxy(request: NextRequest) {
  const isHomePage = request.nextUrl.pathname === "/";
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";
  if (!sessionKey) {
    return isHomePage ? NextResponse.next() : redirectToApp("/auth");
  }

  try {
    const user = await getUserService().findBySessionKey(sessionKey);
    if (isHomePage) {
      return user ? redirectToApp("/training-planner") : NextResponse.next();
    }
    return user ? NextResponse.next() : redirectToApp("/auth");
  } catch (error) {
    if (isHomePage && error instanceof UserNotFoundError) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: ["/", "/training-planner"],
};
