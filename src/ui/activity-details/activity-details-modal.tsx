import { useState } from "react";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
} from "@/domain/training-sessions";
import { Modal, type ModalAction } from "@/ui/components/modal";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";
import { ActivityTransitionForm } from "./components/activity-transition-form";
import { canTransitionActivity } from "./utils/activity-transition-availability";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import {
  useCompleteTrainingSessionMutation,
  useDeleteTrainingSessionMutation,
  useSkipTrainingSessionMutation,
} from "@/ui/training-sessions/training-session-mutations";

export function ActivityDetailsModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const openEditActivity = useTrainingPlannerStore(
    (state) => state.openEditActivity,
  );
  const deleteMutation = useDeleteTrainingSessionMutation();
  const skipMutation = useSkipTrainingSessionMutation();
  const completeMutation = useCompleteTrainingSessionMutation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transitionMode, setTransitionMode] = useState<
    "complete" | "skip" | null
  >(null);

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

  async function completeActivity(request: CompleteTrainingSessionRequest) {
    await completeMutation.mutateAsync({ id: activity.id, request });
    closeModal();
  }

  async function skipActivity(request: SkipTrainingSessionRequest) {
    await skipMutation.mutateAsync({ id: activity.id, request });
    closeModal();
  }

  const isTransitioningActivity = transitionMode !== null;
  const isBusy =
    deleteMutation.isPending ||
    skipMutation.isPending ||
    completeMutation.isPending;

  const headerActions: ModalAction[] = isConfirmingDelete
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
    : isTransitioningActivity
      ? [
          {
            label: "Cancel",
            onClick: () => setTransitionMode(null),
            variant: "secondary",
          },
          {
            ariaLabel: "Close activity details",
            label: "Close",
            onClick: closeModal,
            variant: "secondary",
          },
        ]
      : [
          ...(canTransitionActivity(activity)
            ? [
                {
                  label: "Complete activity",
                  onClick: () => setTransitionMode("complete"),
                  variant: "primary" as const,
                },
                {
                  label: "Skip activity",
                  onClick: () => setTransitionMode("skip"),
                  variant: "danger-outline" as const,
                },
              ]
            : []),
          {
            label: "Edit activity",
            onClick: openEditActivity,
            variant: "primary",
          },
          {
            label: "Delete activity",
            onClick: () => setIsConfirmingDelete(true),
            variant: "danger-outline",
          },
          {
            ariaLabel: "Close activity details",
            label: "Close",
            onClick: closeModal,
            variant: "secondary",
          },
        ];

  return (
    <Modal
      dismissLabel="Dismiss activity details"
      eyebrow={formatActivityType(activity.activityType)}
      footerActions={
        transitionMode
          ? [
              {
                label: "Cancel",
                onClick: () => setTransitionMode(null),
                variant: "secondary",
              },
              {
                form: "activity-transition-form",
                label:
                  transitionMode === "skip"
                    ? skipMutation.isPending
                      ? "Skipping…"
                      : "Skip activity"
                    : completeMutation.isPending
                      ? "Completing…"
                      : "Complete activity",
                type: "submit",
                variant: transitionMode === "skip" ? "danger" : "primary",
              },
            ]
          : []
      }
      headerActions={headerActions}
      isBusy={isBusy}
      onClose={closeModal}
      size="large"
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

      {transitionMode ? (
        <ActivityTransitionForm
          activity={activity}
          isSubmitting={skipMutation.isPending || completeMutation.isPending}
          mode={transitionMode}
          onComplete={completeActivity}
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
