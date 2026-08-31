import type { ZodError } from "zod";

import {
  createTrainingSessionRequestSchema,
  editTrainingSessionRequestSchema,
  type CreateTrainingSessionRequest,
  type EditTrainingSessionRequest,
} from "@/domain/training-sessions";
import { TrainingSessionsRequestValidationError } from "./training-sessions-errors";

export interface TrainingSessionsRequestValidator {
  validateCreate(body: unknown): CreateTrainingSessionRequest;
  validateEdit(body: unknown): EditTrainingSessionRequest;
}

export class DefaultTrainingSessionsRequestValidator implements TrainingSessionsRequestValidator {
  validateCreate(body: unknown): CreateTrainingSessionRequest {
    const result = createTrainingSessionRequestSchema.safeParse(body);
    if (result.success) return result.data;

    throw new TrainingSessionsRequestValidationError(
      this.fieldErrors(result.error, body),
    );
  }

  validateEdit(body: unknown): EditTrainingSessionRequest {
    const result = editTrainingSessionRequestSchema.safeParse(body);
    if (result.success) return result.data;

    throw new TrainingSessionsRequestValidationError(
      this.fieldErrors(result.error, body),
    );
  }

  private fieldErrors(
    error: ZodError,
    body: unknown,
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    const seen = new Set<string>();

    function addIssue(issue: (typeof error.issues)[number]) {
      if (issue.code === "invalid_union" && issue.errors.length > 0) {
        for (const branch of issue.errors) addIssues(branch);
        return;
      }

      const paths =
        issue.code === "unrecognized_keys"
          ? issue.keys.map((key) => [String(key)])
          : [issue.path.map(String)];
      for (const path of paths) {
        const key = path.join(".") || "body";
        const identity = `${key}:${issue.message}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        (errors[key] ??= []).push(issue.message);
      }
    }
    function addIssues(issues: typeof error.issues) {
      for (const issue of issues) addIssue(issue);
    }

    const topIssue = error.issues.find(
      (issue) => issue.code === "invalid_union",
    );
    const activityType = this.activityType(body);
    if (
      topIssue?.code === "invalid_union" &&
      (activityType === "RUN" || activityType === "STRENGTH")
    ) {
      addIssues(topIssue.errors[activityType === "RUN" ? 0 : 1]);
    } else if (activityType !== "RUN" && activityType !== "STRENGTH") {
      const discriminatorIssues: typeof error.issues = [];
      function collectDiscriminatorIssues(issues: typeof error.issues) {
        for (const issue of issues) {
          if (issue.path.length === 1 && issue.path[0] === "activityType") {
            discriminatorIssues.push(issue);
          }
          if (issue.code === "invalid_union") {
            for (const branch of issue.errors)
              collectDiscriminatorIssues(branch);
          }
        }
      }
      collectDiscriminatorIssues(error.issues);
      addIssues(
        discriminatorIssues.length > 0 ? discriminatorIssues : error.issues,
      );
    } else {
      addIssues(error.issues);
    }
    return errors;
  }

  private activityType(body: unknown): unknown {
    return body && typeof body === "object" && "activityType" in body
      ? body.activityType
      : undefined;
  }
}
