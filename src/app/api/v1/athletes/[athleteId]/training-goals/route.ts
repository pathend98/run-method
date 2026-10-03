import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createTrainingGoalRequestSchema } from "@/domain/training-goals";
import { privateResponseHeaders } from "@/server/http/api-handler";
import {
  apiHandler,
  requestAuthenticationService,
  unmarshaler,
  getTrainingGoalsService,
} from "@/server/server";

type RouteContext = { params: Promise<{ athleteId: string }> };

export const GET = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);
    const goals = await getTrainingGoalsService().find(actorId, athleteId);

    return NextResponse.json(goals, { headers: privateResponseHeaders });
  },
  "Unable to fetch training goals",
);

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const body = await unmarshaler.readRequestBody(
      request,
      createTrainingGoalRequestSchema,
    );
    const goal = await getTrainingGoalsService().create(
      actorId,
      athleteId,
      body,
    );

    return NextResponse.json(goal, {
      status: 201,
      headers: privateResponseHeaders,
    });
  },
  "Unable to create training goal",
);
