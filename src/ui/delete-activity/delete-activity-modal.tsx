import { Modal } from "@/ui/components/modal";
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
          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteMutation.isPending}
            onClick={returnToActivityDetails}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={deleteMutation.isPending}
            onClick={() => void deleteActivity()}
            type="button"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
