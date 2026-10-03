import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { editTrainingGoalRequestSchema } from "@/domain/training-goals";
import { privateResponseHeaders } from "@/server/http/api-handler";
import {
  apiHandler,
  requestAuthenticationService,
  unmarshaler,
  getTrainingGoalsService,
} from "@/server/server";

const routeParamsSchema = z.object({ id: z.uuid() });
type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { id } = unmarshaler.unmarshal(
      await context.params,
      routeParamsSchema,
    );
    const body = await unmarshaler.readRequestBody(
      request,
      editTrainingGoalRequestSchema,
    );

    const goal = await getTrainingGoalsService().edit(actorId, id, body);
    return NextResponse.json(goal, { headers: privateResponseHeaders });
  },
  "Unable to edit training goal",
);
