import { useFormContext, useWatch } from "react-hook-form";

import { DurationInput } from "@/ui/components/duration-input";
import { FormField } from "@/ui/components/form-field";
import { getRunTargetMetrics } from "@/ui/training-sessions/run-target-metrics";
import type { AddActivityFormValues } from "../utils/add-activity-form";

export function RunActivityFields() {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<AddActivityFormValues>();
  const targetType = useWatch({ control, name: "targetType" });
  const {
    distance: showDistance,
    duration: showDuration,
    pace: showPace,
  } = getRunTargetMetrics(targetType);

  return (
    <>
      <FormField label="Run target">
        <select {...register("targetType")}>
          <option value="DISTANCE_DURATION">Distance + duration</option>
          <option value="DISTANCE_PACE">Distance + pace</option>
          <option value="DURATION_PACE">Duration + pace</option>
        </select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        {showDistance ? (
          <FormField
            error={errors.distanceKilometres?.message}
            label="Distance (km)"
          >
            <input
              inputMode="decimal"
              placeholder="8"
              {...register("distanceKilometres")}
            />
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
            <input placeholder="5:30" {...register("pacePerKilometre")} />
          </FormField>
        ) : null}
      </div>
    </>
  );
}
