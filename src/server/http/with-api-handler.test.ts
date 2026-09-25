import { NextRequest, NextResponse } from "next/server";

import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { NotFoundError } from "@/server/errors/not-found-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";
import { withApiHandler } from "./with-api-handler";

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
  [new Error("private details"), 500, { error: "Unable to process request" }],
] as const)("maps %s to an API response", async (error, status, body) => {
  const handler = withApiHandler(async (receivedRequest: NextRequest) => {
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
  const handler = withApiHandler(route, "Unable to process request");

  const result = await handler(request, context);

  expect(route).toHaveBeenCalledExactlyOnceWith(request, context);
  expect(result).toBe(response);
  expect(result.status).toBe(201);
  expect(result.headers.get("x-route")).toBe("test");
});
