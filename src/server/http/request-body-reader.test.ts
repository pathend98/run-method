import { NextRequest } from "next/server";

import type { RequestValidationError } from "@/server/errors/request-validation-error";
import { DefaultRequestBodyReader } from "./request-body-reader";

const reader = new DefaultRequestBodyReader();

test("reads a JSON request body", async () => {
  const request = new NextRequest("http://localhost/api/v1/training-sessions", {
    method: "POST",
    body: '{"title":"Easy run"}',
  });
  await expect(reader.readRequestBody(request)).resolves.toEqual({
    title: "Easy run",
  });
});

test.each(["{", ""])(
  "translates unreadable JSON %s into field errors",
  async (body) => {
    const request = new NextRequest(
      "http://localhost/api/v1/training-sessions",
      {
        method: "POST",
        body,
      },
    );
    await expect(reader.readRequestBody(request)).rejects.toMatchObject({
      name: "RequestValidationError",
      fieldErrors: { body: ["Request body must be valid JSON"] },
    } satisfies Partial<RequestValidationError>);
  },
);
