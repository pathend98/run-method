import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { Modal } from "@/ui/components/modal";
import { EditActivityForm } from "./components/edit-activity-form";
import { EditActivitySummary } from "./components/edit-activity-summary";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";

type EditActivityModalProps = {
  isSubmitting: boolean;
  onEdit: (
    id: string,
    request: EditTrainingSessionRequest,
  ) => Promise<TrainingSession>;
};

export function EditActivityModal({
  isSubmitting,
  onEdit,
}: EditActivityModalProps) {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const replaceActivityAndShowDetails = useTrainingPlannerStore(
    (state) => state.replaceActivityAndShowDetails,
  );
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );

  if (activeModal?.kind !== "edit") {
    return null;
  }

  const { activity } = activeModal;

  async function editActivity(request: EditTrainingSessionRequest) {
    const editedActivity = await onEdit(activity.id, request);
    replaceActivityAndShowDetails({ ...editedActivity, day: activity.day });
  }

  return (
    <Modal
      dismissLabel="Dismiss edit activity"
      eyebrow={`${formatActivityType(activity.activityType)} · ${activity.date}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToActivityDetails,
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
          onClick: returnToActivityDetails,
          variant: "secondary",
        },
      ]}
      isBusy={isSubmitting}
      onClose={returnToActivityDetails}
      title="Edit activity"
    >
      <EditActivitySummary activity={activity} />
      <EditActivityForm
        activity={activity}
        onClose={returnToActivityDetails}
        onEdit={editActivity}
      />
    </Modal>
  );
}
