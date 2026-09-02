import type { EditTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/components/modal";
import { EditActivityForm } from "./components/edit-activity-form";
import { EditActivitySummary } from "./components/edit-activity-summary";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";

export function EditActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const replaceActivityAndShowDetails = useTrainingPlannerStore(
    (state) => state.replaceActivityAndShowDetails,
  );
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );
  const modalOperations = useTrainingPlannerStore(
    (state) => state.modalOperations,
  );

  if (activeModal?.kind !== "edit" || !modalOperations) {
    return null;
  }

  const operations = modalOperations;
  const { activity } = activeModal;

  async function editActivity(request: EditTrainingSessionRequest) {
    const editedActivity = await operations.editActivity(activity.id, request);
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
          label: operations.isEditingActivity ? "Saving…" : "Save changes",
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
      isBusy={operations.isEditingActivity}
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
