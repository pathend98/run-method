import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import {
  getTrainingSessionsService,
  trainingSessionsRequestValidator,
} from "@/server/server";
import {
  AthleteNotFoundError,
  TrainingSessionsRequestValidationError,
} from "@/server/training-sessions/training-sessions-errors";

type RouteContext = {
  params: Promise<{ athleteId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { athleteId } = await context.params;
    const { searchParams } = request.nextUrl;
    const sessions = await getTrainingSessionsService().find({
      athleteId,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Unable to fetch training sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body",
        fieldErrors: { body: ["Request body must be valid JSON"] },
      },
      { status: 400 },
    );
  }

  try {
    const { athleteId } = await context.params;
    const createRequest = trainingSessionsRequestValidator.validateCreate(body);
    const session = await getTrainingSessionsService().create({
      ...createRequest,
      userId: athleteId,
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof TrainingSessionsRequestValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400 },
      );
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AthleteNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Unable to create training session" },
      { status: 500 },
    );
  }
}
