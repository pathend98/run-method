import { Modal } from "@/ui/shared/modal/modal";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useDeleteTrainingSessionMutation } from "@/ui/training-sessions/mutations";

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
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToActivityDetails,
          variant: "tertiary",
        },
        {
          label: deleteMutation.isPending ? "Deleting…" : "Delete permanently",
          onClick: () => void deleteActivity(),
          variant: "destructive",
        },
      ]}
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
      </div>
    </Modal>
  );
}
