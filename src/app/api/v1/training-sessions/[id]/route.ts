import { idRouteParamsSchema } from "@/domain/route-params";
import { editTrainingSessionRequestSchema } from "@/domain/training-sessions";
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
  params: Promise<{ id: string }>;
};

export const DELETE = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { id } = unmarshaler.unmarshal(
      await context.params,
      idRouteParamsSchema,
    );

    await getTrainingSessionsService().delete(actorId, id);

    return new Response(null, { status: 204, headers: responseHeaders });
  },
  "Unable to delete training session",
);

export const PATCH = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { id } = unmarshaler.unmarshal(
      await context.params,
      idRouteParamsSchema,
    );

    const body = await unmarshaler.readRequestBody(
      request,
      editTrainingSessionRequestSchema,
    );

    const session = await getTrainingSessionsService().edit(actorId, id, body);

    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to edit training session",
);
