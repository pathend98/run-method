import { NextResponse } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { ConflictError } from "@/server/errors/conflict-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { UnmarshalError } from "@/server/errors/unmarshal-error";
import { RequestValidationError } from "@/server/errors/request-validation-error";

export const privateResponseHeaders = { "Cache-Control": "private, no-store" };
export const noStoreResponseHeaders = { "Cache-Control": "no-store" };

export interface ApiHandler {
  wrap<Args extends unknown[]>(
    handler: (...args: Args) => NextResponse | Promise<NextResponse>,
    failureMessage: string,
    errorHeaders?: HeadersInit,
  ): (...args: Args) => Promise<NextResponse>;
  wrap<Args extends unknown[]>(
    handler: (...args: Args) => Response | Promise<Response>,
    failureMessage: string,
    errorHeaders?: HeadersInit,
  ): (...args: Args) => Promise<Response>;
}

export class DefaultApiHandler implements ApiHandler {
  wrap<Args extends unknown[]>(
    handler: (...args: Args) => NextResponse | Promise<NextResponse>,
    failureMessage: string,
    errorHeaders?: HeadersInit,
  ): (...args: Args) => Promise<NextResponse>;
  wrap<Args extends unknown[]>(
    handler: (...args: Args) => Response | Promise<Response>,
    failureMessage: string,
    errorHeaders?: HeadersInit,
  ): (...args: Args) => Promise<Response>;
  wrap<Args extends unknown[]>(
    handler: (...args: Args) => Response | Promise<Response>,
    failureMessage: string,
    errorHeaders: HeadersInit = privateResponseHeaders,
  ): (...args: Args) => Promise<Response> {
    return async (...args) => {
      try {
        return await handler(...args);
      } catch (error) {
        return this.errorResponse(error, failureMessage, errorHeaders);
      }
    };
  }

  private errorResponse(
    error: unknown,
    failureMessage: string,
    responseHeaders: HeadersInit,
  ): NextResponse {
    if (error instanceof AuthenticationCallbackError) {
      return NextResponse.json(
        { error: "Invalid authorization callback" },
        { status: 400, headers: responseHeaders },
      );
    }
    if (
      error instanceof AuthenticationTokenExchangeError ||
      error instanceof AuthenticationIdTokenVerificationError
    ) {
      return NextResponse.json(
        { error: failureMessage },
        { status: 502, headers: responseHeaders },
      );
    }
    if (
      error instanceof RequestValidationError ||
      error instanceof UnmarshalError
    ) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400, headers: responseHeaders },
      );
    }

    let status: number;
    if (error instanceof BadRequestError) status = 400;
    else if (error instanceof ConflictError) status = 409;
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
}
