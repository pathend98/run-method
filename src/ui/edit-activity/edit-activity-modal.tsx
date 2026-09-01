import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { Modal } from "@/ui/components/modal";
import { EditActivityForm } from "./components/edit-activity-form";
import { EditActivitySummary } from "./components/edit-activity-summary";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";

type EditActivityModalProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  onClose: () => void;
  onEdit: (request: EditTrainingSessionRequest) => Promise<unknown>;
};

export function EditActivityModal({
  activity,
  isSubmitting,
  onClose,
  onEdit,
}: EditActivityModalProps) {
  return (
    <Modal
      dismissLabel="Dismiss edit activity"
      eyebrow={`${formatActivityType(activity.activityType)} · ${activity.date}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: onClose,
          variant: "secondary",
        },
        {
          form: "edit-activity-form",
          label: isSubmitting ? "Saving…" : "Save changes",
          type: "submit",
          variant: "primary",
        },
      ]}
      headerActions={[
        {
          ariaLabel: "Close edit activity",
          label: "Close",
          onClick: onClose,
          variant: "secondary",
        },
      ]}
      isBusy={isSubmitting}
      onClose={onClose}
      title="Edit activity"
    >
      <EditActivitySummary activity={activity} />
      <EditActivityForm activity={activity} onClose={onClose} onEdit={onEdit} />
    </Modal>
  );
}
