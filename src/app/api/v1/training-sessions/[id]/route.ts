import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import {
  trainingSessionsRequestValidator,
  trainingSessionsService,
} from "@/server/server";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsRequestValidationError,
} from "@/server/training-sessions/training-sessions-errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await trainingSessionsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof TrainingSessionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Unable to delete training session" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;
    const patchRequest = trainingSessionsRequestValidator.validatePatch(body);
    const session = await trainingSessionsService.patch(id, patchRequest);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof TrainingSessionsRequestValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400 },
      );
    }
    if (error instanceof TrainingSessionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Unable to edit training session" },
      { status: 500 },
    );
  }
}
