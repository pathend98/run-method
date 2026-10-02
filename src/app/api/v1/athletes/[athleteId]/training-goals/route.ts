import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createTrainingGoalRequestSchema } from "@/domain/training-goals";
import { privateResponseHeaders } from "@/server/http/api-handler";
import {
  apiHandler,
  requestAuthenticationService,
  requestBodyReader,
  getTrainingGoalsService,
} from "@/server/server";

type RouteContext = { params: Promise<{ athleteId: string }> };

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const { athleteId } = await context.params;
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const body = await requestBodyReader.readRequestBody(
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
