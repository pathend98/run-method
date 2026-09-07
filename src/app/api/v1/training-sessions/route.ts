import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  trainingSessionsRequestValidator,
  trainingSessionsService,
} from "@/server/server";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessions = await trainingSessionsService.find({
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

export async function POST(request: NextRequest) {
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
    const createRequest = trainingSessionsRequestValidator.validateCreate(body);
    const session = await trainingSessionsService.create(createRequest);
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
    return NextResponse.json(
      { error: "Unable to create training session" },
      { status: 500 },
    );
  }
}
