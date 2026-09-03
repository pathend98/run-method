import { useFormContext, useWatch } from "react-hook-form";

import {
  RunFieldInput,
  type RunFieldInputValue,
} from "@/ui/run-field-input/run-field-input";
import type { AddActivityFormValues } from "../utils/add-activity-form";

type RunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function RunActivityFields({ onPendingChange }: RunActivityFieldsProps) {
  const {
    control,
    formState: { errors, isSubmitted },
    setValue,
    trigger,
  } = useFormContext<AddActivityFormValues>();
  const fields = useWatch({
    control,
    name: [
      "distanceKilometres",
      "durationHours",
      "durationMinutes",
      "durationSeconds",
      "pacePerKilometre",
      "derivedMetric",
    ],
  });
  const value: RunFieldInputValue = {
    distanceKilometres: fields[0],
    durationHours: fields[1],
    durationMinutes: fields[2],
    durationSeconds: fields[3],
    pacePerKilometre: fields[4],
    derivedMetric: fields[5],
  };

  function changeValue(next: RunFieldInputValue) {
    setValue("distanceKilometres", next.distanceKilometres, {
      shouldDirty: next.distanceKilometres !== value.distanceKilometres,
    });
    setValue("durationHours", next.durationHours, {
      shouldDirty: next.durationHours !== value.durationHours,
    });
    setValue("durationMinutes", next.durationMinutes, {
      shouldDirty: next.durationMinutes !== value.durationMinutes,
    });
    setValue("durationSeconds", next.durationSeconds, {
      shouldDirty: next.durationSeconds !== value.durationSeconds,
    });
    setValue("pacePerKilometre", next.pacePerKilometre, {
      shouldDirty: next.pacePerKilometre !== value.pacePerKilometre,
    });
    setValue("derivedMetric", next.derivedMetric, {
      shouldDirty: next.derivedMetric !== value.derivedMetric,
    });
    if (isSubmitted) {
      void trigger([
        "distanceKilometres",
        "durationHours",
        "durationMinutes",
        "durationSeconds",
        "pacePerKilometre",
        "derivedMetric",
      ]);
    }
  }

  return (
    <RunFieldInput
      errors={{
        distance: errors.distanceKilometres?.message,
        duration:
          errors.durationHours?.message ??
          errors.durationMinutes?.message ??
          errors.durationSeconds?.message,
        pace: errors.pacePerKilometre?.message,
      }}
      onChange={changeValue}
      onPendingChange={onPendingChange}
      value={value}
    />
  );
}
