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
import { authorizeTrainingSession } from "../authorize-training-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const actorId = await authenticateActor(request);
    await authorizeTrainingSession(actorId, id);
    const body = await readRequestBody(request);
    const completeRequest =
      trainingSessionsRequestValidator.validateComplete(body);
    const session = await getTrainingSessionsService().complete(
      id,
      completeRequest,
      request.headers.get("Time-Zone"),
    );
    return NextResponse.json(session, { headers: responseHeaders });
  },
  "Unable to complete training session",
);
