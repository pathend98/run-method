import { useState } from "react";

import { getWeekDateOptions } from "@/core/date/week-date-options";
import { createMoveTrainingSessionRequest } from "./create-move-training-session-request";
import { FormField } from "@/ui/shared/form-field/form-field";
import { Modal } from "@/ui/shared/modal/modal";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useEditTrainingSessionMutation } from "@/ui/activities/mutations/training-session-mutations";

export function MoveActivityModal() {
  const [date, setDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<"AM" | "ANY" | "PM" | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const returnToActivityDetails = useTrainingPlannerStore(
    (state) => state.returnToActivityDetails,
  );
  const editMutation = useEditTrainingSessionMutation();

  if (activeModal?.kind !== "move") {
    return null;
  }

  const { activity } = activeModal;
  const selectedDate = date || activity.date;
  const selectedTimeOfDay = timeOfDay ?? activity.timeOfDay ?? "ANY";
  const days = getWeekDateOptions(activity.date);

  async function moveActivity() {
    try {
      const request = createMoveTrainingSessionRequest(activity, {
        date: selectedDate,
        timeOfDay: selectedTimeOfDay === "ANY" ? null : selectedTimeOfDay,
      });
      await editMutation.mutateAsync({
        id: activity.id,
        request,
      });
      closeModal();
    } catch {
      setError("Unable to move activity. Please try again.");
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss move activity"
      closeLabel="Close move activity"
      footerActions={[
        {
          label: "Cancel",
          onClick: returnToActivityDetails,
          variant: "tertiary",
        },
        {
          label: editMutation.isPending ? "Moving…" : "Move",
          onClick: () => void moveActivity(),
          variant: "primary",
        },
      ]}
      isBusy={editMutation.isPending}
      onClose={returnToActivityDetails}
      title={`Move ${activity.title}`}
    >
      <div className="mt-6 space-y-4">
        {error ? (
          <p
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <p className="text-sm text-zinc-600">
          When do you want to do this activity?
        </p>
        <FormField label="Day">
          <select
            aria-label="Day"
            onChange={(event) => setDate(event.target.value)}
            value={selectedDate}
          >
            {days.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Time">
          <select
            aria-label="Time"
            onChange={(event) =>
              setTimeOfDay(event.target.value as "AM" | "ANY" | "PM")
            }
            value={selectedTimeOfDay}
          >
            <option value="AM">Morning</option>
            <option value="ANY">Anytime</option>
            <option value="PM">Evening</option>
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
