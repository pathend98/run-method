import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  apiHandler,
  requestAuthenticationService,
  requestBodyReader,
  getTrainingSessionsService,
  trainingSessionsRequestValidator,
} from "@/server/server";
import { privateResponseHeaders as responseHeaders } from "@/server/http/api-handler";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

export const GET = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { searchParams } = request.nextUrl;

    const sessions = await getTrainingSessionsService().find(actorId, {
      athleteId,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json(sessions, { headers: responseHeaders });
  },

  "Unable to fetch training sessions",
);

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const session = await getTrainingSessionsService().create(
      actorId,
      athleteId,
      async () =>
        trainingSessionsRequestValidator.validateCreate(
          await requestBodyReader.readRequestBody(request),
        ),
    );

    return NextResponse.json(session, {
      status: 201,
      headers: responseHeaders,
    });
  },

  "Unable to create training session",
);
