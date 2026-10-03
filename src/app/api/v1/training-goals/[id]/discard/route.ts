import { idRouteParamsSchema } from "@/domain/route-params";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { privateResponseHeaders } from "@/server/http/api-handler";
import {
  apiHandler,
  requestAuthenticationService,
  unmarshaler,
  getTrainingGoalsService,
} from "@/server/server";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler.wrap(
  async (request: NextRequest, context: RouteContext) => {
    const actorId =
      await requestAuthenticationService.authenticateActor(request);

    const { id } = unmarshaler.unmarshal(
      await context.params,
      idRouteParamsSchema,
    );

    const goal = await getTrainingGoalsService().discard(actorId, id);
    return NextResponse.json(goal, { headers: privateResponseHeaders });
  },
  "Unable to discard training goal",
);
