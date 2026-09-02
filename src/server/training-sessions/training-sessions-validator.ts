import type {
  CompleteTrainingSessionRequest,
  EditTrainingSessionRequest,
  PatchTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import { TrainingSessionsValidationError } from "./training-sessions-errors";

export interface TrainingSessionsValidator {
  validateEdit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): void;
  validatePatch(
    current: TrainingSession,
    request: PatchTrainingSessionRequest,
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

    if (current.activityType === "RUN") {
      const runRequest = request as Extract<
        EditTrainingSessionRequest,
        { activityType: "RUN" }
      >;
      if (current.targetType !== runRequest.targetType) {
        throw new TrainingSessionsValidationError(
          "targetType cannot be changed",
        );
      }
    }

    if (current.status === "SCHEDULED") return;

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

  validatePatch(
    current: TrainingSession,
    request: PatchTrainingSessionRequest,
  ): void {
    if ("activityType" in request) this.validateEdit(current, request);

    const actualDurationSeconds =
      "actualDurationSeconds" in request
        ? request.actualDurationSeconds
        : undefined;
    const actualDistanceMetres =
      "actualDistanceMetres" in request
        ? request.actualDistanceMetres
        : undefined;
    const skipReason = "skipReason" in request ? request.skipReason : undefined;

    const updatesActuals =
      actualDurationSeconds !== undefined || actualDistanceMetres !== undefined;
    if (updatesActuals) {
      if (current.status !== "COMPLETED") {
        throw new TrainingSessionsValidationError(
          "actual values can only be updated for completed sessions",
        );
      }
      if (
        current.activityType === "STRENGTH" &&
        actualDistanceMetres !== undefined
      ) {
        throw new TrainingSessionsValidationError(
          "actualDistanceMetres is not allowed for strength sessions",
        );
      }
    }

    if (skipReason !== undefined && current.status !== "SKIPPED") {
      throw new TrainingSessionsValidationError(
        "skipReason can only be updated for skipped sessions",
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
    const requestDistance =
      "targetDistanceMetres" in request ? request.targetDistanceMetres : null;
    const requestDuration =
      "targetDurationSeconds" in request ? request.targetDurationSeconds : null;
    const requestPace =
      "targetPaceSecondsPerKilometre" in request
        ? request.targetPaceSecondsPerKilometre
        : null;

    return (
      current.targetDistanceMetres === requestDistance &&
      current.targetDurationSeconds === requestDuration &&
      current.targetPaceSecondsPerKilometre === requestPace
    );
  }
}
