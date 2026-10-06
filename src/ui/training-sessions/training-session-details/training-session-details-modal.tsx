import { Modal, type ModalAction } from "@/ui/shared/modal/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "../formatters";
import { RunDetails } from "./components/run-details";
import { StrengthDetails } from "./components/strength-details";
import { useTrainingSessionDialogsStore } from "@/ui/training-sessions/training-session-dialogs";
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
  const activeModal = useTrainingSessionDialogsStore(
    (state) => state.activeModal,
  );
  const closeModal = useTrainingSessionDialogsStore(
    (state) => state.closeModal,
  );
  const openEditTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openEditTrainingSession,
  );
  const openMoveTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openMoveTrainingSession,
  );
  const openCompleteTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openCompleteTrainingSession,
  );
  const openSkipTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openSkipTrainingSession,
  );
  const openDeleteTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openDeleteTrainingSession,
  );

  if (activeModal?.kind !== "details") {
    return null;
  }

  const { trainingSession } = activeModal;

  const canTransition = canTransitionTrainingSession(trainingSession);
  const primaryHeaderActions: ModalAction[] = [
    {
      label: "Edit",
      onClick: openEditTrainingSession,
      variant: "secondary",
    },
  ];

  const secondaryHeaderActions: ModalAction[] = [
    ...(trainingSession.status === "SCHEDULED"
      ? [
          {
            label: "Move",
            onClick: openMoveTrainingSession,
            variant: "secondary" as const,
          },
        ]
      : []),
    ...(canTransition
      ? [
          {
            label: "Skip",
            onClick: openSkipTrainingSession,
            variant: "warning" as const,
          },
        ]
      : []),
    {
      label: "Delete",
      onClick: openDeleteTrainingSession,
      variant: "destructive",
    },
  ];

  return (
    <Modal
      dismissLabel="Dismiss training session details"
      closeLabel="Close training session details"
      footerActions={
        canTransition
          ? [
              {
                label: "Complete",
                onClick: openCompleteTrainingSession,
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
