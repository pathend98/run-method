import { useFormContext } from "react-hook-form";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import { getRunTargetMetrics } from "@/ui/training-sessions/run-target-metrics";
import type { EditActivityFormValues } from "../utils/edit-activity-form-schema";

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
  const {
    distance: showDistance,
    duration: showDuration,
    pace: showPace,
  } = getRunTargetMetrics(targetType);

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
