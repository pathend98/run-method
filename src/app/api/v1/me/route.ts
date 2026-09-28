import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  authenticateUser,
  privateResponseHeaders,
} from "@/app/api/v1/athlete-authorization";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await authenticateUser(request);
  return NextResponse.json(user, { headers: privateResponseHeaders });
}, "Unable to determine user session");
