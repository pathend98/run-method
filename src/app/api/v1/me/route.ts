import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  authenticateActor,
  privateResponseHeaders,
} from "@/app/api/v1/athlete-authorization";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
  const id = await authenticateActor(request);
  return NextResponse.json({ id }, { headers: privateResponseHeaders });
}, "Unable to determine user session");
