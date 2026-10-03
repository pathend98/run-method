import { athleteRouteParamsSchema } from "@/domain/route-params";
import {
  createTrainingSessionRequestSchema,
  trainingSessionsQuerySchema,
} from "@/domain/training-sessions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  apiHandler,
  requestAuthenticationService,
  unmarshaler,
  getTrainingSessionsService,
} from "@/server/server";
import { privateResponseHeaders as responseHeaders } from "@/server/http/api-handler";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

export const GET = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { athleteId } = unmarshaler.unmarshal(
      await context.params,
      athleteRouteParamsSchema,
    );

    const { searchParams } = request.nextUrl;

    const query = unmarshaler.unmarshal(
      {
        athleteId,
        from: searchParams.get("from") ?? undefined,
        to: searchParams.get("to") ?? undefined,
        status: searchParams.get("status") ?? undefined,
      },
      trainingSessionsQuerySchema,
    );

    const sessions = await getTrainingSessionsService().find(actorId, query);

    return NextResponse.json(sessions, { headers: responseHeaders });
  },

  "Unable to fetch training sessions",
);

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { athleteId } = unmarshaler.unmarshal(
      await context.params,
      athleteRouteParamsSchema,
    );

    const body = await unmarshaler.readRequestBody(
      request,
      createTrainingSessionRequestSchema,
    );

    const session = await getTrainingSessionsService().create(
      actorId,
      athleteId,
      body,
    );

    return NextResponse.json(session, {
      status: 201,
      headers: responseHeaders,
    });
  },

  "Unable to create training session",
);
