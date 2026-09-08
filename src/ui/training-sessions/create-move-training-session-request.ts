import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";

export type TrainingSessionMoveDestination = Pick<
  TrainingSession,
  "date" | "timeOfDay"
>;

export function createMoveTrainingSessionRequest(
  session: TrainingSession,
  destination: TrainingSessionMoveDestination,
): EditTrainingSessionRequest {
  const baseRequest = {
    title: session.title,
    date: destination.date,
    timeOfDay: destination.timeOfDay,
    description: session.description,
  } as const;

  return session.activityType === "RUN"
    ? {
        ...baseRequest,
        activityType: "RUN",
        targetDistanceMetres: session.targetDistanceMetres,
        targetDurationSeconds: session.targetDurationSeconds,
      }
    : {
        ...baseRequest,
        activityType: "STRENGTH",
        targetDurationSeconds: session.targetDurationSeconds,
      };
}
