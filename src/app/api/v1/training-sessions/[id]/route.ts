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
  params: Promise<{ id: string }>;
};

export const DELETE = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    await getTrainingSessionsService().delete(actorId, id);

    return new Response(null, { status: 204, headers: responseHeaders });
  },
  "Unable to delete training session",
);

export const PATCH = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const session = await getTrainingSessionsService().edit(
      actorId,
      id,
      async () =>
        trainingSessionsRequestValidator.validateEdit(
          await requestBodyReader.readRequestBody(request),
        ),
    );

    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to edit training session",
);
