import type { z } from "zod";

import { UnmarshalError } from "./errors/unmarshal-error";

import { RequestBodyValidationError } from "@/server/errors/request-body-validation-error";

export interface Unmarshaler {
  unmarshal<TSchema extends z.ZodType>(
    value: unknown,
    schema: TSchema,
  ): z.output<TSchema>;
  readRequestBody<TSchema extends z.ZodType>(
    request: Request,
    schema: TSchema,
  ): Promise<z.output<TSchema>>;
}

export class DefaultUnmarshaler implements Unmarshaler {
  async readRequestBody<TSchema extends z.ZodType>(
    request: Request,
    schema: TSchema,
  ): Promise<z.output<TSchema>> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new RequestBodyValidationError({
        body: ["Request body must be valid JSON"],
      });
    }

    try {
      return this.unmarshal(body, schema);
    } catch (error) {
      if (error instanceof UnmarshalError) {
        throw new RequestBodyValidationError(error.fieldErrors);
      }
      throw error;
    }
  }

  unmarshal<TSchema extends z.ZodType>(
    value: unknown,
    schema: TSchema,
  ): z.output<TSchema> {
    const result = schema.safeParse(value);
    if (result.success) return result.data;

    throw new UnmarshalError(this.fieldErrors(result.error));
  }

  private fieldErrors(error: z.ZodError): Record<string, string[]> {
    const errors = new Map<string, string[]>();
    this.collectFieldErrors(error.issues, [], errors);
    return Object.fromEntries(errors);
  }

  private collectFieldErrors(
    issues: readonly z.core.$ZodIssue[],
    parentPath: readonly PropertyKey[],
    errors: Map<string, string[]>,
  ): void {
    for (const issue of issues) {
      const path = [...parentPath, ...issue.path];
      if (issue.code === "invalid_union" && issue.errors.length > 0) {
        for (const branch of issue.errors) {
          this.collectFieldErrors(branch, path, errors);
        }
        continue;
      }

      const paths =
        issue.code === "unrecognized_keys"
          ? issue.keys.map((key) => [...path, key])
          : [path];
      for (const fieldPath of paths) {
        const key = fieldPath.map(String).join(".") || "body";
        const messages = errors.get(key) ?? [];
        if (messages.includes(issue.message)) continue;
        messages.push(issue.message);
        errors.set(key, messages);
      }
    }
  }
}
