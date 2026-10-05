import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useSkipTrainingSessionMutation } from "../mutations";
import { SkipActivityForm } from "./components/skip-activity-form";
import { SkippedActivitySummary } from "./components/skipped-activity-summary";

export function SkipActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const returnFromActivityTransition = useTrainingPlannerStore(
    (state) => state.returnFromActivityTransition,
  );
  const finishActivityTransition = useTrainingPlannerStore(
    (state) => state.finishActivityTransition,
  );
  const skipMutation = useSkipTrainingSessionMutation();

  if (activeModal?.kind !== "skip") return null;
  const { activity } = activeModal;

  async function skipActivity(request: SkipTrainingSessionRequest) {
    await skipMutation.mutateAsync({ id: activity.id, request });
    finishActivityTransition();
  }

  return (
    <Modal
      dismissLabel="Dismiss skip activity"
      closeLabel="Close skip activity"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnFromActivityTransition,
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
      onClose={returnFromActivityTransition}
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
