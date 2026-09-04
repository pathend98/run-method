import { Modal } from "@/ui/components/modal";
import { Button } from "@/ui/components/button";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useDeleteTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";

export function DeleteActivityModal() {
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );
  const deleteMutation = useDeleteTrainingSessionMutation();

  if (activeModal?.kind !== "delete") return null;
  const { activity } = activeModal;

  async function deleteActivity() {
    try {
      await deleteMutation.mutateAsync(activity.id);
      closeModal();
    } catch {
      // The mutation remains available for retry and the error is rendered below.
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss delete activity"
      closeLabel="Close delete activity"
      isBusy={deleteMutation.isPending}
      onClose={returnToActivityDetails}
      title={activity.title}
    >
      <div className="mt-6 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-950">Delete this activity?</p>
        <p className="mt-2">This action cannot be undone.</p>
        {deleteMutation.isError ? (
          <p className="mt-4 font-medium text-red-700" role="alert">
            Unable to delete activity. Please try again.
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            disabled={deleteMutation.isPending}
            onClick={returnToActivityDetails}
            type="button"
            variant="tertiary"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => void deleteActivity()}
            type="button"
            variant="destructive"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
