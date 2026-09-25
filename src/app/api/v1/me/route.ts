import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { getUserService } from "@/server/server";
import { UserNotFoundError } from "@/server/user/user-errors";

const responseHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
  if (!sessionKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: responseHeaders },
    );
  }

  try {
    const user = await getUserService().findBySessionKey(sessionKey);
    return NextResponse.json({ id: user.id }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: responseHeaders },
      );
    }
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500, headers: responseHeaders },
    );
  }
}
