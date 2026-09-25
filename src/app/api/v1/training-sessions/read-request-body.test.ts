import { NextRequest } from "next/server";

import type { TrainingSessionsRequestValidationError } from "@/server/training-sessions/training-sessions-errors";
import { readRequestBody } from "./read-request-body";

test("reads a JSON request body", async () => {
  const request = new NextRequest("http://localhost/api/v1/training-sessions", {
    method: "POST",
    body: '{"title":"Easy run"}',
  });
  await expect(readRequestBody(request)).resolves.toEqual({
    title: "Easy run",
  });
});

test("translates malformed JSON into field errors", async () => {
  const request = new NextRequest("http://localhost/api/v1/training-sessions", {
    method: "POST",
    body: "{",
  });
  await expect(readRequestBody(request)).rejects.toMatchObject({
    name: "TrainingSessionsRequestValidationError",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  } satisfies Partial<TrainingSessionsRequestValidationError>);
});
