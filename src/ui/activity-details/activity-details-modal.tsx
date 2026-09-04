import { useState } from "react";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
} from "@/domain/training-sessions";
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
  const [runFieldsPending, setRunFieldsPending] = useState(false);

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
      : isTransitioningActivity
      ? [
          {
            label: "Cancel",
            onClick: () => setTransitionMode(null),
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
    !isConfirmingDelete && !isTransitioningActivity
      ? [
          ...(canTransition
            ? [
                {
                  label: "Skip activity",
                  onClick: () => setTransitionMode("skip"),
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
        transitionMode
          ? [
              {
                label: "Cancel",
                onClick: () => setTransitionMode(null),
                variant: "secondary",
              },
              {
                disabled:
                  transitionMode === "complete" && runFieldsPending,
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
          : canTransition
            ? [
                {
                  label: "Complete activity",
                  onClick: () => setTransitionMode("complete"),
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

      {transitionMode ? (
        <ActivityTransitionForm
          activity={activity}
          isSubmitting={skipMutation.isPending || completeMutation.isPending}
          mode={transitionMode}
          onComplete={completeActivity}
          onRunFieldsPendingChange={setRunFieldsPending}
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
