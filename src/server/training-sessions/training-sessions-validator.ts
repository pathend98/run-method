import type {
  CompleteTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import { format } from "date-fns";
import { TrainingSessionsValidationError } from "./training-sessions-errors";

export interface TrainingSessionsValidator {
  validateEdit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): void;
  validateSkip(current: TrainingSession): void;
  validateComplete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
  ): void;
}

export class DefaultTrainingSessionsValidator implements TrainingSessionsValidator {
  constructor(private readonly now: () => Date = () => new Date()) {}

  validateSkip(current: TrainingSession): void {
    this.validateScheduledTransition(current, "skipped");
  }

  validateComplete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
  ): void {
    this.validateScheduledTransition(current, "completed");

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

  private validateScheduledTransition(
    current: TrainingSession,
    transition: "completed" | "skipped",
  ): void {
    if (current.status !== "SCHEDULED") {
      throw new TrainingSessionsValidationError(
        `only scheduled training sessions can be ${transition}`,
      );
    }

    if (current.date > format(this.now(), "yyyy-MM-dd")) {
      throw new TrainingSessionsValidationError(
        `future training sessions cannot be ${transition}`,
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
