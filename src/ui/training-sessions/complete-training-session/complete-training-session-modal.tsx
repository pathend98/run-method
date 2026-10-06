import { useState } from "react";

import type { CompleteTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import { useTrainingSessionDialogsStore } from "@/ui/training-sessions/training-session-dialogs";
import { useCompleteTrainingSessionMutation } from "@/ui/training-sessions/mutations";
import { CompleteTrainingSessionForm } from "./components/complete-training-session-form";
import { PlannedRunSummary } from "./components/planned-run-summary";

export function CompleteTrainingSessionModal() {
  const activeModal = useTrainingSessionDialogsStore(
    (state) => state.activeModal,
  );
  const returnFromTrainingSessionTransition = useTrainingSessionDialogsStore(
    (state) => state.returnFromTrainingSessionTransition,
  );
  const finishTrainingSessionTransition = useTrainingSessionDialogsStore(
    (state) => state.finishTrainingSessionTransition,
  );
  const completeMutation = useCompleteTrainingSessionMutation();
  const [runFieldsPending, setRunFieldsPending] = useState(false);

  if (activeModal?.kind !== "complete") return null;
  const { trainingSession } = activeModal;

  async function completeTrainingSession(
    request: CompleteTrainingSessionRequest,
  ) {
    await completeMutation.mutateAsync({ id: trainingSession.id, request });
    finishTrainingSessionTransition();
  }

  return (
    <Modal
      dismissLabel="Dismiss complete training session"
      closeLabel="Close complete training session"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnFromTrainingSessionTransition,
          variant: "tertiary",
        },
        {
          disabled: runFieldsPending,
          form: "complete-training-session-form",
          label: completeMutation.isPending
            ? "Completing…"
            : "Complete training session",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={completeMutation.isPending}
      onClose={returnFromTrainingSessionTransition}
      title={trainingSession.title}
    >
      <h3 className="mt-6 text-base font-semibold text-zinc-950">
        How did it go?
      </h3>
      <CompleteTrainingSessionForm
        trainingSession={trainingSession}
        isSubmitting={completeMutation.isPending}
        onComplete={completeTrainingSession}
        onRunFieldsPendingChange={setRunFieldsPending}
      />
      {trainingSession.activityType === "RUN" ? (
        <PlannedRunSummary trainingSession={trainingSession} />
      ) : null}
    </Modal>
  );
}
