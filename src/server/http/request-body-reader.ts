import { RequestValidationError } from "@/server/errors/request-validation-error";

export interface RequestBodyReader {
  readRequestBody(request: Request): Promise<unknown>;
}

export class DefaultRequestBodyReader implements RequestBodyReader {
  async readRequestBody(request: Request): Promise<unknown> {
    try {
      return await request.json();
    } catch {
      throw new RequestValidationError({
        body: ["Request body must be valid JSON"],
      });
    }
  }
}
