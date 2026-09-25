import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { readAuthenticationEnv } from "@/server/env/authentication-env";
import { getUserService } from "@/server/server";

function redirectToAuth() {
  const callbackUrl = readAuthenticationEnv().OIDC_CALLBACK_URL;
  return NextResponse.redirect(new URL("/auth", callbackUrl));
}

export async function proxy(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value ?? "";
  if (!sessionKey) {
    return redirectToAuth();
  }

  try {
    const user = await getUserService().findBySessionKey(sessionKey);
    return user ? NextResponse.next() : redirectToAuth();
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
