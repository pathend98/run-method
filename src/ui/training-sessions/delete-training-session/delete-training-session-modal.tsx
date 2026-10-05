import { Modal } from "@/ui/shared/modal/modal";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useDeleteTrainingSessionMutation } from "@/ui/training-sessions/mutations";

export function DeleteTrainingSessionModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToTrainingSessionDetails = useTrainingPlannerStore(
    (state) => state.returnToTrainingSessionDetails,
  );
  const deleteMutation = useDeleteTrainingSessionMutation();

  if (activeModal?.kind !== "delete") return null;
  const { activity: trainingSession } = activeModal;

  async function deleteTrainingSession() {
    try {
      await deleteMutation.mutateAsync(trainingSession.id);
      closeModal();
    } catch {
      // The mutation remains available for retry and the error is rendered below.
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss delete training session"
      closeLabel="Close delete training session"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToTrainingSessionDetails,
          variant: "tertiary",
        },
        {
          label: deleteMutation.isPending ? "Deleting…" : "Delete permanently",
          onClick: () => void deleteTrainingSession(),
          variant: "destructive",
        },
      ]}
      isBusy={deleteMutation.isPending}
      onClose={returnToTrainingSessionDetails}
      title={trainingSession.title}
    >
      <div className="mt-6 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-950">
          Delete this training session?
        </p>
        <p className="mt-2">This action cannot be undone.</p>
        {deleteMutation.isError ? (
          <p className="mt-4 font-medium text-red-700" role="alert">
            Unable to delete training session. Please try again.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
