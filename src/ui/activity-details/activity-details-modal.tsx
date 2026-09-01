import { useState } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import { Modal, type ModalAction } from "@/ui/components/modal";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";

type ActivityDetailsModalProps = {
  activity: TrainingSession;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<unknown>;
  onEdit: () => void;
};

export function ActivityDetailsModal({
  activity,
  isDeleting,
  onClose,
  onDelete,
  onEdit,
}: ActivityDetailsModalProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    : [
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
      headerActions={headerActions}
      isBusy={isDeleting}
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

      {activity.activityType === "RUN" ? (
        <RunActivityDetails activity={activity} />
      ) : (
        <StrengthActivityDetails activity={activity} />
      )}
    </Modal>
  );
}
