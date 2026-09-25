import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  authenticateActor,
  authorizeAthlete,
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
    authorizeAthlete(actorId, athleteId);
    const { searchParams } = request.nextUrl;
    const sessions = await getTrainingSessionsService().find({
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
    authorizeAthlete(actorId, athleteId);
    const body = await readRequestBody(request);
    const createRequest = trainingSessionsRequestValidator.validateCreate(body);
    const session = await getTrainingSessionsService().create({
      ...createRequest,
      athleteId,
    });
    return NextResponse.json(session, {
      status: 201,
      headers: responseHeaders,
    });
  },
  "Unable to create training session",
);
