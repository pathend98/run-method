import { useState } from "react";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal, type ModalAction } from "@/ui/components/modal";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";
import { ActivityTransitionForm } from "./components/activity-transition-form";
import { canTransitionActivity } from "./utils/activity-transition-availability";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import {
  useDeleteTrainingSessionMutation,
  useSkipTrainingSessionMutation,
} from "@/ui/training-sessions/training-session-mutations";

export function ActivityDetailsModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const openEditActivity = useTrainingPlannerStore(
    (state) => state.openEditActivity,
  );
  const openCompleteActivity = useTrainingPlannerStore(
    (state) => state.openCompleteActivity,
  );
  const deleteMutation = useDeleteTrainingSessionMutation();
  const skipMutation = useSkipTrainingSessionMutation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

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

  async function skipActivity(request: SkipTrainingSessionRequest) {
    await skipMutation.mutateAsync({ id: activity.id, request });
    closeModal();
  }

  const isBusy =
    deleteMutation.isPending ||
    skipMutation.isPending;

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
      : isSkipping
      ? [
          {
            label: "Cancel",
            onClick: () => setIsSkipping(false),
            variant: "secondary",
          },
        ]
      : [
          {
            label: "Edit activity",
            onClick: openEditActivity,
            variant: "primary",
          },
        ];

  const secondaryHeaderActions: ModalAction[] =
    !isConfirmingDelete && !isSkipping
      ? [
          ...(canTransition
            ? [
                {
                  label: "Skip activity",
                  onClick: () => setIsSkipping(true),
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
        isSkipping
          ? [
              {
                label: "Cancel",
                onClick: () => setIsSkipping(false),
                variant: "secondary",
              },
              {
                form: "activity-transition-form",
                label: skipMutation.isPending ? "Skipping…" : "Skip activity",
                type: "submit",
                variant: "danger",
              },
            ]
          : canTransition
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

      {isSkipping ? (
        <ActivityTransitionForm
          isSubmitting={skipMutation.isPending}
          onSkip={skipActivity}
        />
      ) : null}

      {activity.activityType === "RUN" ? (
        <RunActivityDetails activity={activity} />
      ) : (
        <StrengthActivityDetails activity={activity} />
      )}
    </Modal>
  );
}
