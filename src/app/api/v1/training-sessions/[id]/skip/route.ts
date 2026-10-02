import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  apiHandler,
  requestAuthenticationService,
  requestBodyReader,
  getTrainingSessionsService,
} from "@/server/server";
import { privateResponseHeaders as responseHeaders } from "@/server/http/api-handler";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const session = await getTrainingSessionsService().skip(
      actorId,
      id,
      await requestBodyReader.readRequestBody(request),
      request.headers.get("Time-Zone"),
    );

    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to skip training session",
);
