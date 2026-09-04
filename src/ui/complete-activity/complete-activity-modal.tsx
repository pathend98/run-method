import { useState } from "react";

import type { CompleteTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/components/modal";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCompleteTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";
import { CompleteActivityForm } from "./components/complete-activity-form";
import { PlannedRunSummary } from "./components/planned-run-summary";

export function CompleteActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToActivityDetails = useTrainingPlannerStore((state) => state.returnToActivityDetails);
  const completeMutation = useCompleteTrainingSessionMutation();
  const [runFieldsPending, setRunFieldsPending] = useState(false);

  if (activeModal?.kind !== "complete") return null;
  const { activity } = activeModal;

  async function completeActivity(request: CompleteTrainingSessionRequest) {
    await completeMutation.mutateAsync({ id: activity.id, request });
    closeModal();
  }

  return (
    <Modal
      dismissLabel="Dismiss complete activity"
      closeLabel="Close complete activity"
      footerActions={[
        { label: "Cancel", onClick: returnToActivityDetails, variant: "secondary" },
        { disabled: runFieldsPending, form: "complete-activity-form", label: completeMutation.isPending ? "Completing…" : "Complete activity", type: "submit", variant: "primary" },
      ]}
      isBusy={completeMutation.isPending}
      onClose={returnToActivityDetails}
      title={activity.title}
    >
      <h3 className="mt-6 text-base font-semibold text-zinc-950">How did it go?</h3>
      <CompleteActivityForm activity={activity} isSubmitting={completeMutation.isPending} onComplete={completeActivity} onRunFieldsPendingChange={setRunFieldsPending} />
      {activity.activityType === "RUN" ? <PlannedRunSummary activity={activity} /> : null}
    </Modal>
  );
}
