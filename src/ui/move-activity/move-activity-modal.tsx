import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { useState } from "react";

import { editTrainingSessionRequestSchema } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import { Modal } from "@/ui/components/modal";
import {
  useTrainingPlannerStore,
  type Weekday,
} from "@/ui/training-planner/training-planner-store";
import { useEditTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";

export function MoveActivityModal() {
  const [date, setDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<
    "AM" | "ANY" | "PM" | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const replaceActivityAndShowDetails = useTrainingPlannerStore(
    (state) => state.replaceActivityAndShowDetails,
  );
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
  const weekStart = startOfWeek(parseISO(activity.date), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    return { label: format(day, "EEEE d MMM"), value: format(day, "yyyy-MM-dd") };
  });

  async function moveActivity() {
    try {
      const request = editTrainingSessionRequestSchema.parse({
        title: activity.title,
        date: selectedDate,
        timeOfDay: selectedTimeOfDay === "ANY" ? null : selectedTimeOfDay,
        description: activity.description,
        activityType: activity.activityType,
        ...(activity.activityType === "RUN"
          ? {
              targetDistanceMetres: activity.targetDistanceMetres,
              targetDurationSeconds: activity.targetDurationSeconds,
            }
          : { targetDurationSeconds: activity.targetDurationSeconds }),
      });
      const movedActivity = await editMutation.mutateAsync({
        id: activity.id,
        request,
      });
      replaceActivityAndShowDetails({
        ...movedActivity,
        day: format(parseISO(movedActivity.date), "EEEE") as Weekday,
      });
    } catch {
      setError("Unable to move activity. Please try again.");
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss move activity"
      closeLabel="Close move activity"
      footerActions={[
        { label: "Cancel", onClick: returnToActivityDetails, variant: "tertiary" },
        { label: editMutation.isPending ? "Moving…" : "Move", onClick: () => void moveActivity(), variant: "primary" },
      ]}
      isBusy={editMutation.isPending}
      onClose={returnToActivityDetails}
      title={`Move ${activity.title}`}
    >
      <div className="mt-6 space-y-4">
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
        <FormField label="Day">
          <select aria-label="Day" onChange={(event) => setDate(event.target.value)} value={selectedDate}>
            {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </FormField>
        <FormField label="Time">
          <select aria-label="Time" onChange={(event) => setTimeOfDay(event.target.value as "AM" | "ANY" | "PM")} value={selectedTimeOfDay}>
            <option value="AM">Morning</option>
            <option value="ANY">Anytime</option>
            <option value="PM">Evening</option>
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
