import { format, parseISO } from "date-fns";
import { useState } from "react";

import type { EditTrainingSessionRequest } from "@/domain/training-sessions";
import { Modal } from "@/ui/shared/modal/modal";
import { EditTrainingSessionForm } from "./components/edit-training-session-form";
import { EditTrainingSessionSummary } from "./components/edit-training-session-summary";
import { formatActivityType } from "@/ui/training-sessions/formatters";
import { useTrainingSessionDialogsStore } from "@/ui/training-sessions/training-session-dialogs";
import { useEditTrainingSessionMutation } from "@/ui/training-sessions/mutations";

export function EditTrainingSessionModal() {
  const [runFieldsPending, setRunFieldsPending] = useState(false);
  const activeModal = useTrainingSessionDialogsStore(
    (state) => state.activeModal,
  );
  const closeModal = useTrainingSessionDialogsStore(
    (state) => state.closeModal,
  );
  const returnToTrainingSessionDetails = useTrainingSessionDialogsStore(
    (state) => state.returnToTrainingSessionDetails,
  );
  const editMutation = useEditTrainingSessionMutation();

  if (activeModal?.kind !== "edit") {
    return null;
  }

  const { trainingSession } = activeModal;

  async function editTrainingSession(request: EditTrainingSessionRequest) {
    await editMutation.mutateAsync({
      id: trainingSession.id,
      request,
    });
    closeModal();
  }

  return (
    <Modal
      dismissLabel="Dismiss edit training session"
      closeLabel="Close edit training session"
      eyebrow={`${formatActivityType(trainingSession.activityType)} · ${format(parseISO(trainingSession.date), "EEEE, d MMMM")}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToTrainingSessionDetails,
          variant: "tertiary",
        },
        {
          disabled: runFieldsPending,
          form: "edit-training-session-form",
          label: editMutation.isPending ? "Saving…" : "Save changes",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={editMutation.isPending}
      onClose={returnToTrainingSessionDetails}
      size="large"
      title="Edit training session"
    >
      <EditTrainingSessionSummary trainingSession={trainingSession} />
      <EditTrainingSessionForm
        trainingSession={trainingSession}
        onClose={returnToTrainingSessionDetails}
        onEdit={editTrainingSession}
        onRunFieldsPendingChange={setRunFieldsPending}
      />
    </Modal>
  );
}
