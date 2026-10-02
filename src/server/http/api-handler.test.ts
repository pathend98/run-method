import { NextRequest, NextResponse } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";
import { DefaultApiHandler, noStoreResponseHeaders } from "./api-handler";
import { RequestValidationError } from "@/server/errors/request-validation-error";

const apiHandler = new DefaultApiHandler();

const request = new NextRequest("https://app.example.com/api/v1/test");

test.each([
  [new BadRequestError("Bad input"), 400, { error: "Bad input" }],
  [new UnauthorizedError(), 401, { error: "Unauthorized" }],
  [new ForbiddenError(), 403, { error: "Forbidden" }],
  [new NotFoundError("Missing"), 404, { error: "Missing" }],
  [
    new AuthenticationLookupError(),
    500,
    { error: "Unable to determine user session" },
  ],
  [
    new TrainingSessionsRequestValidationError({ title: ["Required"] }),
    400,
    { error: "Invalid request body", fieldErrors: { title: ["Required"] } },
  ],
  [
    new RequestValidationError({ body: ["Invalid JSON"] }),
    400,
    { error: "Invalid request body", fieldErrors: { body: ["Invalid JSON"] } },
  ],
  [new Error("private details"), 500, { error: "Unable to process request" }],
] as const)("maps %s to an API response", async (error, status, body) => {
  const handler = apiHandler.wrap(async (receivedRequest: NextRequest) => {
    expect(receivedRequest).toBe(request);
    throw error;
  }, "Unable to process request");

  const response = await handler(request);

  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(body);
});

test("forwards the request and context and preserves successful responses", async () => {
  const context = { params: Promise.resolve({ id: "session-id" }) };
  const response = NextResponse.json(
    { id: "session-id" },
    { status: 201, headers: { "X-Route": "test" } },
  );
  const route = vi.fn(
    async (receivedRequest: NextRequest, receivedContext: typeof context) => {
      expect(receivedRequest).toBe(request);
      expect(receivedContext).toBe(context);
      return response;
    },
  );
  const handler = apiHandler.wrap(route, "Unable to process request");

  const result = await handler(request, context);

  expect(route).toHaveBeenCalledExactlyOnceWith(request, context);
  expect(result).toBe(response);
  expect(result.status).toBe(201);
  expect(result.headers.get("x-route")).toBe("test");
});

test.each([
  [
    new AuthenticationCallbackError("State mismatch"),
    400,
    "Invalid authorization callback",
  ],
  [
    new AuthenticationTokenExchangeError(),
    502,
    "Unable to complete authentication",
  ],
  [
    new AuthenticationIdTokenVerificationError(),
    502,
    "Unable to complete authentication",
  ],
] as const)(
  "maps authentication error %s to a safe response",
  async (error, status, message) => {
    const handler = apiHandler.wrap(async () => {
      throw error;
    }, "Unable to complete authentication");

    const response = await handler();

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ error: message });
  },
);

test("supports zero-argument synchronous handlers and preserves plain Responses", async () => {
  const response = new Response(null, { status: 204 });
  const handler = apiHandler.wrap(() => response, "Failure");
  expect(await handler()).toBe(response);
});

test.each([
  new Error("private details"),
  new BadRequestError("Bad input"),
  new RequestValidationError({ body: ["Invalid JSON"] }),
  new AuthenticationCallbackError("Invalid callback"),
  new AuthenticationTokenExchangeError(),
])("uses the supplied error headers for %s", async (error) => {
  const handler = apiHandler.wrap(
    () => {
      throw error;
    },
    "Failure",
    noStoreResponseHeaders,
  );
  const response = await handler();
  expect(response.headers.get("cache-control")).toBe("no-store");
});
