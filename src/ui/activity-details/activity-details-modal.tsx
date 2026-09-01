import { useState } from "react";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { Modal, type ModalAction } from "@/ui/components/modal";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";
import { ActivityTransitionForm } from "./components/activity-transition-form";

type ActivityDetailsModalProps = {
  activity: TrainingSession;
  isDeleting: boolean;
  isTransitioning?: boolean;
  onClose: () => void;
  onComplete?: (
    request: CompleteTrainingSessionRequest,
  ) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onEdit: () => void;
  onSkip?: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

export function ActivityDetailsModal({
  activity,
  isDeleting,
  isTransitioning = false,
  onClose,
  onComplete = async () => undefined,
  onDelete,
  onEdit,
  onSkip = async () => undefined,
}: ActivityDetailsModalProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transitionMode, setTransitionMode] = useState<
    "complete" | "skip" | null
  >(null);

  async function confirmDelete() {
    setDeleteError(null);

    try {
      await onDelete();
      onClose();
    } catch {
      setDeleteError("Unable to delete activity. Please try again.");
    }
  }

  function cancelDelete() {
    setDeleteError(null);
    setIsConfirmingDelete(false);
  }

  async function completeActivity(request: CompleteTrainingSessionRequest) {
    await onComplete(request);
    onClose();
  }

  async function skipActivity(request: SkipTrainingSessionRequest) {
    await onSkip(request);
    onClose();
  }

  const isTransitioningActivity = transitionMode !== null;
  const isBusy = isDeleting || isTransitioning;

  const headerActions: ModalAction[] = isConfirmingDelete
    ? [
        {
          label: "Cancel",
          onClick: cancelDelete,
          variant: "secondary",
        },
        {
          label: isDeleting ? "Deleting…" : "Delete permanently",
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
            onClick: onClose,
            variant: "secondary",
          },
        ]
      : [
        ...(activity.status === "SCHEDULED"
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
          onClick: onEdit,
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
          onClick: onClose,
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
                    ? isTransitioning
                      ? "Skipping…"
                      : "Skip activity"
                    : isTransitioning
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
      onClose={onClose}
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
          isSubmitting={isTransitioning}
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
