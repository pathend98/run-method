import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  authenticateActor,
  privateResponseHeaders as responseHeaders,
} from "@/app/api/v1/athlete-authorization";
import { readRequestBody } from "@/app/api/v1/training-sessions/read-request-body";
import { withApiHandler } from "@/server/http/with-api-handler";
import {
  getTrainingSessionsService,
  trainingSessionsRequestValidator,
} from "@/server/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const DELETE = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId = await authenticateActor(request);
    await getTrainingSessionsService().delete(actorId, id);
    return new Response(null, { status: 204, headers: responseHeaders });
  },
  "Unable to delete training session",
);

export const PATCH = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId = await authenticateActor(request);
    const session = await getTrainingSessionsService().edit(
      actorId,
      id,
      async () =>
        trainingSessionsRequestValidator.validateEdit(
          await readRequestBody(request),
        ),
    );
    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to edit training session",
);
