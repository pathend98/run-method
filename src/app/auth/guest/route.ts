import { NextResponse } from "next/server";

import { apiHandler, getUserService } from "@/server/server";
import { noStoreResponseHeaders } from "@/server/http/api-handler";
import {
  COOKIE_OPTIONS,
  USER_SESSION_COOKIE_NAME,
} from "@/server/authentication/authentication-constants";
import { readAppEnv } from "@/server/env/app-env";
import { SESSION_MAX_AGE_SECONDS } from "@/server/user/user-constants";

export const GET = apiHandler.wrap(
  async () => {
    const sessionKey = await getUserService().startGuestSession();
    const response = NextResponse.redirect(
      new URL("/", readAppEnv().APP_BASE_URL),
    );
    response.headers.set(
      "Cache-Control",
      noStoreResponseHeaders["Cache-Control"],
    );
    response.cookies.set(USER_SESSION_COOKIE_NAME, sessionKey, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  },
  "Unable to complete authentication",
  noStoreResponseHeaders,
);
