import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useSkipTrainingSessionMutation } from "../mutations";
import { SkipTrainingSessionForm } from "./components/skip-training-session-form";
import { SkippedTrainingSessionSummary } from "./components/skipped-training-session-summary";

export function SkipTrainingSessionModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const returnFromTrainingSessionTransition = useTrainingPlannerStore(
    (state) => state.returnFromTrainingSessionTransition,
  );
  const finishTrainingSessionTransition = useTrainingPlannerStore(
    (state) => state.finishTrainingSessionTransition,
  );
  const skipMutation = useSkipTrainingSessionMutation();

  if (activeModal?.kind !== "skip") return null;
  const { trainingSession } = activeModal;

  async function skipTrainingSession(request: SkipTrainingSessionRequest) {
    await skipMutation.mutateAsync({ id: trainingSession.id, request });
    finishTrainingSessionTransition();
  }

  return (
    <Modal
      dismissLabel="Dismiss skip training session"
      closeLabel="Close skip training session"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnFromTrainingSessionTransition,
          variant: "tertiary",
        },
        {
          form: "skip-training-session-form",
          label: skipMutation.isPending ? "Skipping…" : "Skip training session",
          type: "submit",
          variant: "warning",
        },
      ]}
      isBusy={skipMutation.isPending}
      onClose={returnFromTrainingSessionTransition}
      subtitle={`${formatActivityType(trainingSession.activityType)} · ${formatStatus(trainingSession.status)} · ${formatTimeOfDay(trainingSession.timeOfDay)}`}
      title={trainingSession.title}
    >
      <SkippedTrainingSessionSummary trainingSession={trainingSession} />
      <SkipTrainingSessionForm
        isSubmitting={skipMutation.isPending}
        onSkip={skipTrainingSession}
      />
    </Modal>
  );
}
