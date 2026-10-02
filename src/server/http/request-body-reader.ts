import type { z } from "zod";

import { RequestBodyValidationError } from "@/server/errors/request-body-validation-error";

export interface RequestBodyReader {
  readRequestBody(request: Request): Promise<unknown>;
  readRequestBody<TSchema extends z.ZodType>(
    request: Request,
    schema: TSchema,
  ): Promise<z.output<TSchema>>;
}

export class DefaultRequestBodyReader implements RequestBodyReader {
  readRequestBody(request: Request): Promise<unknown>;
  readRequestBody<TSchema extends z.ZodType>(
    request: Request,
    schema: TSchema,
  ): Promise<z.output<TSchema>>;
  async readRequestBody(
    request: Request,
    schema?: z.ZodType,
  ): Promise<unknown> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new RequestBodyValidationError({
        body: ["Request body must be valid JSON"],
      });
    }

    if (!schema) return body;

    const result = await schema.safeParseAsync(body);
    if (result.success) return result.data;

    throw new RequestBodyValidationError(this.fieldErrors(result.error));
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
