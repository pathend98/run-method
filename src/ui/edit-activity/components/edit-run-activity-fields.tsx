import { useFormContext } from "react-hook-form";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import type { EditActivityFormValues } from "../utils/edit-activity-form";

type EditRunActivityFieldsProps = {
  targetType: RunTrainingSession["targetType"];
};

export function EditRunActivityFields({
  targetType,
}: EditRunActivityFieldsProps) {
  const {
    formState: { errors },
    register,
  } = useFormContext<EditActivityFormValues>();
  const showDistance =
    targetType === "DISTANCE_DURATION" || targetType === "DISTANCE_PACE";
  const showDuration =
    targetType === "DISTANCE_DURATION" || targetType === "DURATION_PACE";
  const showPace =
    targetType === "DISTANCE_PACE" || targetType === "DURATION_PACE";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showDistance ? (
        <FormField
          error={errors.distanceKilometres?.message}
          label="Distance (km)"
        >
          <input inputMode="decimal" {...register("distanceKilometres")} />
        </FormField>
      ) : null}
      {showDuration ? (
        <FormField
          error={errors.durationMinutes?.message}
          label="Duration (minutes)"
        >
          <input inputMode="numeric" {...register("durationMinutes")} />
        </FormField>
      ) : null}
      {showPace ? (
        <FormField
          error={errors.pacePerKilometre?.message}
          label="Pace (mm:ss / km)"
        >
          <input {...register("pacePerKilometre")} />
        </FormField>
      ) : null}
    </div>
  );
}
