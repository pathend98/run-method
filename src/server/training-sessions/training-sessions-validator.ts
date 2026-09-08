import type {
  CompleteTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import { TrainingSessionsValidationError } from "./training-sessions-errors";

export interface TrainingSessionsValidator {
  validateEdit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): void;
  validateSkip(current: TrainingSession, timeZone: string | null): void;
  validateComplete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): void;
}

export class DefaultTrainingSessionsValidator implements TrainingSessionsValidator {
  constructor(private readonly now: () => Date = () => new Date()) {}

  validateSkip(current: TrainingSession, timeZone: string | null): void {
    this.validateScheduledTransition(current, "skipped", timeZone);
  }

  validateComplete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): void {
    this.validateScheduledTransition(current, "completed", timeZone);

    if (current.activityType === "RUN" && !request.actualDistanceMetres) {
      throw new TrainingSessionsValidationError(
        "actualDistanceMetres is required to complete a run",
      );
    }
    if (
      current.activityType === "STRENGTH" &&
      request.actualDistanceMetres !== undefined
    ) {
      throw new TrainingSessionsValidationError(
        "actualDistanceMetres is not allowed for strength sessions",
      );
    }
  }

  validateEdit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): void {
    if (current.activityType !== request.activityType) {
      throw new TrainingSessionsValidationError(
        "activityType cannot be changed",
      );
    }

    if (current.status === "SCHEDULED") {
      if (this.hasActuals(request)) {
        throw new TrainingSessionsValidationError(
          "actual metrics can only be changed for completed sessions",
        );
      }
      return;
    }

    if (request.date !== undefined && request.date !== current.date) {
      throw new TrainingSessionsValidationError(
        "date cannot be changed for completed or skipped sessions",
      );
    }

    if (current.status === "SKIPPED" && this.hasActuals(request)) {
      throw new TrainingSessionsValidationError(
        "actual metrics can only be changed for completed sessions",
      );
    }

    if (current.timeOfDay !== request.timeOfDay) {
      throw new TrainingSessionsValidationError(
        "timeOfDay cannot be changed for completed or skipped sessions",
      );
    }

    if (
      current.activityType === "RUN" &&
      !this.runTargetsEqual(
        current,
        request as Extract<EditTrainingSessionRequest, { activityType: "RUN" }>,
      )
    ) {
      throw new TrainingSessionsValidationError(
        "run targets cannot be changed for completed or skipped sessions",
      );
    }

    if (
      current.activityType === "STRENGTH" &&
      request.activityType === "STRENGTH" &&
      current.targetDurationSeconds !== request.targetDurationSeconds
    ) {
      throw new TrainingSessionsValidationError(
        "strength target duration cannot be changed for completed or skipped sessions",
      );
    }
  }

  private validateScheduledTransition(
    current: TrainingSession,
    transition: "completed" | "skipped",
    timeZone: string | null,
  ): void {
    if (current.status !== "SCHEDULED") {
      throw new TrainingSessionsValidationError(
        `only scheduled training sessions can be ${transition}`,
      );
    }

    if (current.date > this.currentDate(timeZone)) {
      throw new TrainingSessionsValidationError(
        `future training sessions cannot be ${transition}`,
      );
    }
  }

  private currentDate(timeZone: string | null): string {
    if (!timeZone) {
      throw new TrainingSessionsValidationError("Time-Zone header is required");
    }

    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(this.now());
      const values = new Map(
        parts.map((part) => [part.type, part.value] as const),
      );

      return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
    } catch {
      throw new TrainingSessionsValidationError(
        "Time-Zone header must be a valid IANA timezone",
      );
    }
  }

  private runTargetsEqual(
    current: RunTrainingSession,
    request: Extract<EditTrainingSessionRequest, { activityType: "RUN" }>,
  ): boolean {
    return (
      current.targetDistanceMetres === request.targetDistanceMetres &&
      current.targetDurationSeconds === request.targetDurationSeconds
    );
  }

  private hasActuals(request: EditTrainingSessionRequest): boolean {
    return (
      request.actualDurationSeconds !== undefined ||
      (request.activityType === "RUN" &&
        request.actualDistanceMetres !== undefined)
    );
  }
}
