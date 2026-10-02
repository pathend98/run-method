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
  params: Promise<{ athleteId: string }>;
};

export const GET = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId = await authenticateActor(request);
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

export const POST = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId = await authenticateActor(request);
    const session = await getTrainingSessionsService().create(
      actorId,
      athleteId,
      async () =>
        trainingSessionsRequestValidator.validateCreate(
          await readRequestBody(request),
        ),
    );
    return NextResponse.json(session, {
      status: 201,
      headers: responseHeaders,
    });
  },
  "Unable to create training session",
);
