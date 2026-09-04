import { Modal, type ModalAction } from "@/ui/components/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";
import { canTransitionActivity } from "./utils/activity-transition-availability";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";

export function ActivityDetailsModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const openEditActivity = useTrainingPlannerStore(
    (state) => state.openEditActivity,
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

  const { activity } = activeModal;

  const canTransition = canTransitionActivity(activity);
  const primaryHeaderActions: ModalAction[] = [
    {
      label: "Edit activity",
      onClick: openEditActivity,
      variant: "primary",
    },
  ];

  const secondaryHeaderActions: ModalAction[] = [
    ...(canTransition
      ? [
          {
            label: "Skip activity",
            onClick: openSkipActivity,
            variant: "danger-outline" as const,
          },
        ]
      : []),
    {
      label: "Delete activity",
      onClick: openDeleteActivity,
      variant: "danger-outline",
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
                label: "Complete activity",
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
      subtitle={`${formatActivityType(activity.activityType)} · ${formatStatus(activity.status)} · ${formatTimeOfDay(activity.timeOfDay)}`}
      title={activity.title}
    >
      {activity.activityType === "RUN" ? (
        <RunActivityDetails activity={activity} />
      ) : (
        <StrengthActivityDetails activity={activity} />
      )}
    </Modal>
  );
}
