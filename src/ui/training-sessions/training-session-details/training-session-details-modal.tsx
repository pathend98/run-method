import { Modal, type ModalAction } from "@/ui/shared/modal/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "../formatters";
import { RunDetails } from "./components/run-details";
import { StrengthDetails } from "./components/strength-details";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import type { TrainingSession } from "@/domain/training-sessions";
import { format } from "date-fns";

function canTransitionTrainingSession(
  trainingSession: TrainingSession,
  now = new Date(),
): boolean {
  return (
    trainingSession.status === "SCHEDULED" &&
    trainingSession.date <= format(now, "yyyy-MM-dd")
  );
}

export function TrainingSessionDetailsModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const openEditActivity = useTrainingPlannerStore(
    (state) => state.openEditActivity,
  );
  const openMoveActivity = useTrainingPlannerStore(
    (state) => state.openMoveActivity,
  );
  const openCompleteActivity = useTrainingPlannerStore(
    (state) => state.openCompleteActivity,
  );
  const openSkipActivity = useTrainingPlannerStore(
    (state) => state.openSkipActivity,
  );
  const openDeleteActivity = useTrainingPlannerStore(
    (state) => state.openDeleteActivity,
  );

  if (activeModal?.kind !== "details") {
    return null;
  }

  const { activity: trainingSession } = activeModal;

  const canTransition = canTransitionTrainingSession(trainingSession);
  const primaryHeaderActions: ModalAction[] = [
    {
      label: "Edit",
      onClick: openEditActivity,
      variant: "secondary",
    },
  ];

  const secondaryHeaderActions: ModalAction[] = [
    ...(trainingSession.status === "SCHEDULED"
      ? [
          {
            label: "Move",
            onClick: openMoveActivity,
            variant: "secondary" as const,
          },
        ]
      : []),
    ...(canTransition
      ? [
          {
            label: "Skip",
            onClick: openSkipActivity,
            variant: "warning" as const,
          },
        ]
      : []),
    {
      label: "Delete",
      onClick: openDeleteActivity,
      variant: "destructive",
    },
  ];

  return (
    <Modal
      dismissLabel="Dismiss activity details"
      closeLabel="Close activity details"
      footerActions={
        canTransition
          ? [
              {
                label: "Complete",
                onClick: openCompleteActivity,
                variant: "primary",
              },
            ]
          : []
      }
      onClose={closeModal}
      primaryHeaderActions={primaryHeaderActions}
      secondaryHeaderActions={secondaryHeaderActions}
      size="large"
      subtitle={`${formatActivityType(trainingSession.activityType)} · ${formatStatus(trainingSession.status)} · ${formatTimeOfDay(trainingSession.timeOfDay)}`}
      title={trainingSession.title}
    >
      {trainingSession.activityType === "RUN" ? (
        <RunDetails trainingSession={trainingSession} />
      ) : (
        <StrengthDetails trainingSession={trainingSession} />
      )}
    </Modal>
  );
}
