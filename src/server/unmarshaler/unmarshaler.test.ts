import { UnmarshalError } from "@/server/errors/unmarshal-error";

import { NextRequest } from "next/server";
import { z } from "zod";

import type { RequestBodyValidationError } from "@/server/errors/request-body-validation-error";
import { DefaultUnmarshaler, type Unmarshaler } from "./unmarshaler";

const reader = new DefaultUnmarshaler();

// Run the same validation assertions against parsed input and the HTTP wrapper.
const validationModes = ["request", "value"] as const;

test("reads a JSON request body", async () => {
  const request = new NextRequest("http://localhost/api/v1/training-sessions", {
    method: "POST",
    body: '{"title":"Easy run"}',
  });
  await expect(
    reader.readRequestBody(request, z.object({ title: z.string() })),
  ).resolves.toEqual({
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
    await expect(
      reader.readRequestBody(request, z.object({ title: z.string() })),
    ).rejects.toMatchObject({
      name: "RequestBodyValidationError",
      fieldErrors: { body: ["Request body must be valid JSON"] },
    } satisfies Partial<RequestBodyValidationError>);
  },
);

test("returns schema output with transformations and defaults, reading JSON once", async () => {
  const schema = z.object({
    title: z.string().trim(),
    duration: z.string().transform(Number),
    description: z.string().default("Easy effort"),
  });
  const request = new NextRequest("http://localhost/api/v1/training-sessions", {
    method: "POST",
    body: '{"title":"  Easy run  ","duration":"1800"}',
  });
  const readJson = vi.spyOn(request, "json");
  const result = reader.readRequestBody(request, schema);
  expectTypeOf(result).toEqualTypeOf<Promise<z.output<typeof schema>>>();
  expectTypeOf(result).toEqualTypeOf<
    Promise<{ title: string; duration: number; description: string }>
  >();
  const readerInterface: Unmarshaler = reader;
  expectTypeOf(
    readerInterface.readRequestBody<typeof schema>,
  ).returns.toEqualTypeOf<Promise<z.output<typeof schema>>>();
  await expect(result).resolves.toEqual({
    title: "Easy run",
    duration: 1800,
    description: "Easy effort",
  });
  expect(readJson).toHaveBeenCalledExactlyOnceWith();
});

describe.each(validationModes)("schema validation through %s", (mode) => {
  const errorName =
    mode === "request" ? "RequestBodyValidationError" : "UnmarshalError";
  const errorMessage =
    mode === "request" ? "Invalid request body" : "Invalid input";
  async function validate<TSchema extends z.ZodType>(
    request: Request,
    schema: TSchema,
  ): Promise<z.output<TSchema>> {
    if (mode === "request") return reader.readRequestBody(request, schema);
    return reader.unmarshal(await request.json(), schema);
  }
  test.each([true, false])(
    "supports synchronous refinement returning %s",
    async (valid) => {
      const schema = z.object({
        title: z.string().refine(() => valid, "Title rejected"),
      });
      const request = new NextRequest(
        "http://localhost/api/v1/training-sessions",
        {
          method: "POST",
          body: '{"title":"Easy run"}',
        },
      );
      const result = validate(request, schema);
      if (valid) {
        await expect(result).resolves.toEqual({ title: "Easy run" });
      } else {
        await expect(result).rejects.toMatchObject({
          name: errorName,
          message: errorMessage,
          fieldErrors: { title: ["Title rejected"] },
        });
      }
    },
  );

  test("preserves full paths for nested validation messages", async () => {
    const schema = z.object({
      title: z.string().min(1, "Title required"),
      details: z.object({
        distance: z.number().positive("Distance must be positive"),
        duration: z.number().positive("Duration must be positive"),
      }),
    });
    const request = new NextRequest(
      "http://localhost/api/v1/training-sessions",
      {
        method: "POST",
        body: '{"title":"","details":{"distance":0,"duration":0}}',
      },
    );
    await expect(validate(request, schema)).rejects.toMatchObject({
      name: errorName,
      fieldErrors: {
        title: ["Title required"],
        "details.distance": ["Distance must be positive"],
        "details.duration": ["Duration must be positive"],
      },
    });
  });

  test.each(["Content", ""])(
    "combines root errors with body-field errors for %s",
    async (body) => {
      const schema = z
        .object({ body: z.string().min(1, "Body required") })
        .refine(() => false, "Request rejected");
      const request = new NextRequest(
        "http://localhost/api/v1/training-sessions",
        {
          method: "POST",
          body: JSON.stringify({ body }),
        },
      );
      await expect(validate(request, schema)).rejects.toMatchObject({
        name: errorName,
        fieldErrors: {
          body: body
            ? ["Request rejected"]
            : ["Body required", "Request rejected"],
        },
      });
    },
  );

  test.each(["{", ""])(
    "rejects malformed JSON %s before schema validation",
    async (body) => {
      const schema = z.object({ title: z.string() });
      const validate = vi.spyOn(schema, "safeParse");
      const request = new NextRequest(
        "http://localhost/api/v1/training-sessions",
        {
          method: "POST",
          body,
        },
      );
      await expect(
        reader.readRequestBody(request, schema),
      ).rejects.toMatchObject({
        name: "RequestBodyValidationError",
        fieldErrors: { body: ["Request body must be valid JSON"] },
      });
      expect(validate).not.toHaveBeenCalled();
    },
  );

  test("propagates unexpected schema exceptions", async () => {
    const failure = new Error("Unexpected refinement failure");
    const schema = z.string().transform(() => {
      throw failure;
    });
    const request = new NextRequest(
      "http://localhost/api/v1/training-sessions",
      {
        method: "POST",
        body: '"Easy run"',
      },
    );
    await expect(validate(request, schema)).rejects.toBe(failure);
  });

  test("expands nested union branches with array paths and deduplicates messages", async () => {
    const schema = z.object({
      title: z.string().min(1, "Title required"),
      items: z.array(
        z.union([
          z.strictObject({
            value: z.union([
              z.string({ error: "Must be text" }),
              z.number({ error: "Must be numeric" }),
            ]),
          }),
          z.strictObject({ value: z.string({ error: "Must be text" }) }),
        ]),
      ),
    });
    const request = new NextRequest("http://localhost/api/v1/test", {
      method: "POST",
      body: JSON.stringify({
        title: "",
        items: [{ value: null, extra: true }],
      }),
    });

    await expect(validate(request, schema)).rejects.toMatchObject({
      name: errorName,
      fieldErrors: {
        title: ["Title required"],
        "items.0.value": ["Must be text", "Must be numeric"],
        "items.0.extra": ['Unrecognized key: "extra"'],
      },
    });
  });

  test("assigns unexpected keys to their containing object paths", async () => {
    const schema = z.strictObject({
      details: z.strictObject({ title: z.string() }),
    });
    const request = new NextRequest("http://localhost/api/v1/test", {
      method: "POST",
      body: JSON.stringify({
        extra: true,
        details: { title: "Valid", first: true, second: true },
      }),
    });

    await expect(validate(request, schema)).rejects.toMatchObject({
      fieldErrors: {
        extra: ['Unrecognized key: "extra"'],
        "details.first": ['Unrecognized keys: "first", "second"'],
        "details.second": ['Unrecognized keys: "first", "second"'],
      },
    });
  });

  test("deduplicates messages per field and preserves their order", async () => {
    const schema = z.object({
      title: z
        .string()
        .min(2, "Too short")
        .refine(() => false, "Too short")
        .refine(() => false, "Rejected"),
      description: z.string().min(2, "Too short"),
    });
    const request = new NextRequest("http://localhost/api/v1/test", {
      method: "POST",
      body: '{"title":"x","description":"x"}',
    });

    await expect(validate(request, schema)).rejects.toMatchObject({
      fieldErrors: {
        title: ["Too short", "Rejected"],
        description: ["Too short"],
      },
    });
  });

  test("maps pathless union branch errors to the body", async () => {
    const schema = z.union([
      z.string({ error: "Must be text" }),
      z.number({ error: "Must be numeric" }),
    ]);
    const request = new NextRequest("http://localhost/api/v1/test", {
      method: "POST",
      body: "null",
    });

    await expect(validate(request, schema)).rejects.toMatchObject({
      fieldErrors: { body: ["Must be text", "Must be numeric"] },
    });
  });

  test.each(["unknown", "text"])(
    "preserves discriminated union errors for %s",
    async (kind) => {
      const schema = z.object({
        payload: z.discriminatedUnion("kind", [
          z.object({
            kind: z.literal("text"),
            text: z.string({ error: "Text required" }),
          }),
          z.object({ kind: z.literal("number"), number: z.number() }),
        ]),
      });
      const request = new NextRequest("http://localhost/api/v1/test", {
        method: "POST",
        body: JSON.stringify({ payload: { kind } }),
      });

      await expect(validate(request, schema)).rejects.toHaveProperty(
        "fieldErrors",
        kind === "unknown"
          ? { "payload.kind": [expect.any(String)] }
          : { "payload.text": ["Text required"] },
      );
    },
  );

  test("handles field names that also exist on Object.prototype", async () => {
    const schema = z.object({}).refine(() => false, {
      path: ["__proto__"],
      message: "Field rejected",
    });
    const request = new NextRequest("http://localhost/api/v1/test", {
      method: "POST",
      body: '{"__proto__":true}',
    });

    await expect(validate(request, schema)).rejects.toMatchObject({
      fieldErrors: { ["__proto__"]: ["Field rejected"] },
    });
  });
});

test("unmarshals unknown values synchronously with inferred schema output", () => {
  const value: unknown = { title: "  Easy run  ", duration: "1800" };
  const schema = z.object({
    title: z.string().trim(),
    duration: z.string().transform(Number),
    description: z.string().default("Easy effort"),
  });
  const unmarshaler: Unmarshaler = reader;
  const result = unmarshaler.unmarshal(value, schema);
  expectTypeOf(result).toEqualTypeOf<z.output<typeof schema>>();
  expectTypeOf(result).toEqualTypeOf<{
    title: string;
    duration: number;
    description: string;
  }>();
  expect(result).toEqual({
    title: "Easy run",
    duration: 1800,
    description: "Easy effort",
  });
});

test("treats strings as values rather than decoding JSON", () => {
  const value = '{"title":"Easy run"}';
  expect(reader.unmarshal(value, z.string())).toBe(value);
  expect(() =>
    reader.unmarshal(value, z.object({ title: z.string() })),
  ).toThrow(UnmarshalError);
});

test("throws validation errors synchronously", () => {
  expect(() => reader.unmarshal(null, z.object({ title: z.string() }))).toThrow(
    UnmarshalError,
  );
});

test("delegates request validation to unmarshal", async () => {
  const request = new NextRequest("http://localhost/api/v1/test", {
    method: "POST",
    body: '{"title":"Easy run"}',
  });
  const schema = z.object({ title: z.string() });
  const unmarshal = vi.spyOn(reader, "unmarshal");
  await expect(reader.readRequestBody(request, schema)).resolves.toEqual({
    title: "Easy run",
  });
  expect(unmarshal).toHaveBeenCalledExactlyOnceWith(
    { title: "Easy run" },
    schema,
  );
  unmarshal.mockRestore();
});
