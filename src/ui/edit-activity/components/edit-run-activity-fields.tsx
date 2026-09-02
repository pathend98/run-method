import { useFormContext } from "react-hook-form";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { DurationInput } from "@/ui/components/duration-input";
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
        <DurationInput error={errors.durationHours?.message ?? errors.durationMinutes?.message ?? errors.durationSeconds?.message} hoursName="durationHours" label="Duration (hh:mm:ss)" minutesName="durationMinutes" register={register} secondsName="durationSeconds" />
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
