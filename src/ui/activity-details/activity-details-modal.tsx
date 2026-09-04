import { useState } from "react";
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
import { useDeleteTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";

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
  const deleteMutation = useDeleteTrainingSessionMutation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (activeModal?.kind !== "details") {
    return null;
  }

  const { activity } = activeModal;

  async function confirmDelete() {
    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(activity.id);
      closeModal();
    } catch {
      setDeleteError("Unable to delete activity. Please try again.");
    }
  }

  function cancelDelete() {
    setDeleteError(null);
    setIsConfirmingDelete(false);
  }

  const isBusy = deleteMutation.isPending;

  const canTransition = canTransitionActivity(activity);
  const primaryHeaderActions: ModalAction[] = isConfirmingDelete
    ? [
        {
          label: "Cancel",
          onClick: cancelDelete,
          variant: "secondary",
        },
        {
          label: deleteMutation.isPending ? "Deleting…" : "Delete permanently",
          onClick: () => void confirmDelete(),
          variant: "danger",
        },
      ]
    : [
        {
          label: "Edit activity",
          onClick: openEditActivity,
          variant: "primary",
        },
      ];

  const secondaryHeaderActions: ModalAction[] = !isConfirmingDelete
    ? [
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
          onClick: () => setIsConfirmingDelete(true),
          variant: "danger-outline",
        },
      ]
    : [];

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
      isBusy={isBusy}
      onClose={closeModal}
      primaryHeaderActions={primaryHeaderActions}
      secondaryHeaderActions={secondaryHeaderActions}
      size="large"
      subtitle={`${formatActivityType(activity.activityType)} · ${formatStatus(activity.status)} · ${formatTimeOfDay(activity.timeOfDay)}`}
      title={activity.title}
    >
      {isConfirmingDelete ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Delete “{activity.title}”?</p>
          <p>This action cannot be undone.</p>
          {deleteError ? (
            <p className="mt-2 font-medium text-red-700" role="alert">
              {deleteError}
            </p>
          ) : null}
        </div>
      ) : null}

      {activity.activityType === "RUN" ? (
        <RunActivityDetails activity={activity} />
      ) : (
        <StrengthActivityDetails activity={activity} />
      )}
    </Modal>
  );
}
