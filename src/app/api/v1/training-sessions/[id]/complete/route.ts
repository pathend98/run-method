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

export const POST = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId = await authenticateActor(request);
    const session = await getTrainingSessionsService().complete(
      actorId,
      id,
      async () =>
        trainingSessionsRequestValidator.validateComplete(
          await readRequestBody(request),
        ),
      request.headers.get("Time-Zone"),
    );
    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to complete training session",
);
