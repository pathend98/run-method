import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/components/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/training-session-label-formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useSkipTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";
import { SkipActivityForm } from "./components/skip-activity-form";
import { SkippedActivitySummary } from "./components/skipped-activity-summary";

export function SkipActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );
  const skipMutation = useSkipTrainingSessionMutation();

  if (activeModal?.kind !== "skip") return null;
  const { activity } = activeModal;

  async function skipActivity(request: SkipTrainingSessionRequest) {
    await skipMutation.mutateAsync({ id: activity.id, request });
    closeModal();
  }

  return (
    <Modal
      dismissLabel="Dismiss skip activity"
      closeLabel="Close skip activity"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToActivityDetails,
          variant: "tertiary",
        },
        {
          form: "skip-activity-form",
          label: skipMutation.isPending ? "Skipping…" : "Skip activity",
          type: "submit",
          variant: "warning",
        },
      ]}
      isBusy={skipMutation.isPending}
      onClose={returnToActivityDetails}
      subtitle={`${formatActivityType(activity.activityType)} · ${formatStatus(activity.status)} · ${formatTimeOfDay(activity.timeOfDay)}`}
      title={activity.title}
    >
      <SkippedActivitySummary activity={activity} />
      <SkipActivityForm
        isSubmitting={skipMutation.isPending}
        onSkip={skipActivity}
      />
    </Modal>
  );
}
