import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";

const responseHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(error: unknown, failureMessage: string): NextResponse {
  if (error instanceof TrainingSessionsRequestValidationError) {
    return NextResponse.json(
      { error: error.message, fieldErrors: error.fieldErrors },
      { status: 400, headers: responseHeaders },
    );
  }

  let status: number;
  if (error instanceof BadRequestError) status = 400;
  else if (error instanceof UnauthorizedError) status = 401;
  else if (error instanceof ForbiddenError) status = 403;
  else if (error instanceof NotFoundError) status = 404;
  else if (error instanceof AuthenticationLookupError) status = 500;
  else {
    return NextResponse.json(
      { error: failureMessage },
      { status: 500, headers: responseHeaders },
    );
  }

  return NextResponse.json(
    { error: error.message },
    { status, headers: responseHeaders },
  );
}

export function withApiHandler<Args extends [NextRequest, ...unknown[]]>(
  handler: (...args: Args) => Response | Promise<Response>,
  failureMessage: string,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error, failureMessage);
    }
  };
}
