import { useFormContext, useWatch } from "react-hook-form";

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
          <FormField
            error={errors.durationMinutes?.message}
            label="Duration (minutes)"
          >
            <input
              inputMode="numeric"
              placeholder="45"
              {...register("durationMinutes")}
            />
          </FormField>
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
