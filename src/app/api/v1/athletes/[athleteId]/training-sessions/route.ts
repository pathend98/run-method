import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { USER_SESSION_COOKIE_NAME } from "@/server/authentication/authentication-constants";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import {
  getTrainingSessionsService,
  getUserService,
  trainingSessionsRequestValidator,
} from "@/server/server";
import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

const responseHeaders = { "Cache-Control": "private, no-store" };

async function authorizeAthlete(
  request: NextRequest,
  athleteId: string,
): Promise<NextResponse | null> {
  const sessionKey = request.cookies.get(USER_SESSION_COOKIE_NAME)?.value;
  if (!sessionKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: responseHeaders },
    );
  }

  try {
    const actor = await getUserService().findBySessionKey(sessionKey);
    if (actor.id !== athleteId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: responseHeaders },
      );
    }
    return null;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: responseHeaders },
      );
    }
    return NextResponse.json(
      { error: "Unable to determine user session" },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { athleteId } = await context.params;
    const denial = await authorizeAthlete(request, athleteId);
    if (denial) return denial;

    const { searchParams } = request.nextUrl;
    const sessions = await getTrainingSessionsService().find({
      athleteId,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json(sessions, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: responseHeaders },
      );
    }

    return NextResponse.json(
      { error: "Unable to fetch training sessions" },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { athleteId } = await context.params;
  const denial = await authorizeAthlete(request, athleteId);
  if (denial) return denial;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body",
        fieldErrors: { body: ["Request body must be valid JSON"] },
      },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const createRequest = trainingSessionsRequestValidator.validateCreate(body);
    const session = await getTrainingSessionsService().create({
      ...createRequest,
      athleteId,
    });
    return NextResponse.json(session, {
      status: 201,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof TrainingSessionsRequestValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400, headers: responseHeaders },
      );
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: responseHeaders },
      );
    }
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404, headers: responseHeaders },
      );
    }
    return NextResponse.json(
      { error: "Unable to create training session" },
      { status: 500, headers: responseHeaders },
    );
  }
}
