import { useEffect } from "react";

import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { EditActivityForm } from "./components/edit-activity-form";
import { EditActivityHeader } from "./components/edit-activity-header";
import { EditActivitySummary } from "./components/edit-activity-summary";

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
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Dismiss edit activity"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        disabled={isSubmitting}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="edit-activity-title"
        aria-modal="true"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        role="dialog"
      >
        <EditActivityHeader
          activity={activity}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />
        <EditActivitySummary activity={activity} />
        <EditActivityForm
          activity={activity}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onEdit={onEdit}
        />
      </section>
    </div>
  );
}
