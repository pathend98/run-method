import { useState } from "react";

import type { CompleteTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCompleteTrainingSessionMutation } from "@/ui/training-sessions/mutations";
import { CompleteActivityForm } from "./components/complete-activity-form";
import { PlannedRunSummary } from "./components/planned-run-summary";

export function CompleteActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const returnFromTrainingSessionTransition = useTrainingPlannerStore(
    (state) => state.returnFromTrainingSessionTransition,
  );
  const finishTrainingSessionTransition = useTrainingPlannerStore(
    (state) => state.finishTrainingSessionTransition,
  );
  const completeMutation = useCompleteTrainingSessionMutation();
  const [runFieldsPending, setRunFieldsPending] = useState(false);

  if (activeModal?.kind !== "complete") return null;
  const { activity } = activeModal;

  async function completeActivity(request: CompleteTrainingSessionRequest) {
    await completeMutation.mutateAsync({ id: activity.id, request });
    finishTrainingSessionTransition();
  }

  return (
    <Modal
      dismissLabel="Dismiss complete activity"
      closeLabel="Close complete activity"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnFromTrainingSessionTransition,
          variant: "tertiary",
        },
        {
          disabled: runFieldsPending,
          form: "complete-activity-form",
          label: completeMutation.isPending
            ? "Completing…"
            : "Complete activity",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={completeMutation.isPending}
      onClose={returnFromTrainingSessionTransition}
      title={activity.title}
    >
      <h3 className="mt-6 text-base font-semibold text-zinc-950">
        How did it go?
      </h3>
      <CompleteActivityForm
        activity={activity}
        isSubmitting={completeMutation.isPending}
        onComplete={completeActivity}
        onRunFieldsPendingChange={setRunFieldsPending}
      />
      {activity.activityType === "RUN" ? (
        <PlannedRunSummary activity={activity} />
      ) : null}
    </Modal>
  );
}
