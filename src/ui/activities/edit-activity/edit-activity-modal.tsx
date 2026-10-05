import { format, parseISO } from "date-fns";
import { useState } from "react";

import type { EditTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import { EditActivityForm } from "./components/edit-activity-form";
import { EditActivitySummary } from "./components/edit-activity-summary";
import { formatActivityType } from "@/ui/activities/formatters/training-session-label-formatters";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useEditTrainingSessionMutation } from "@/ui/activities/mutations/training-session-mutations";

export function EditActivityModal() {
  const [runFieldsPending, setRunFieldsPending] = useState(false);
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );
  const editMutation = useEditTrainingSessionMutation();

  if (activeModal?.kind !== "edit") {
    return null;
  }

  const { activity } = activeModal;

  async function editActivity(request: EditTrainingSessionRequest) {
    await editMutation.mutateAsync({
      id: activity.id,
      request,
    });
    closeModal();
  }

  return (
    <Modal
      dismissLabel="Dismiss edit activity"
      closeLabel="Close edit activity"
      eyebrow={`${formatActivityType(activity.activityType)} · ${format(parseISO(activity.date), "EEEE, d MMMM")}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToActivityDetails,
          variant: "tertiary",
        },
        {
          disabled: runFieldsPending,
          form: "edit-activity-form",
          label: editMutation.isPending ? "Saving…" : "Save changes",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={editMutation.isPending}
      onClose={returnToActivityDetails}
      size="large"
      title="Edit activity"
    >
      <EditActivitySummary activity={activity} />
      <EditActivityForm
        activity={activity}
        onClose={returnToActivityDetails}
        onEdit={editActivity}
        onRunFieldsPendingChange={setRunFieldsPending}
      />
    </Modal>
  );
}
