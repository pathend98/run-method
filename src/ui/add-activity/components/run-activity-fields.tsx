import { useCallback } from "react";
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
    formState: { errors },
    setValue,
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

  const changeValue = useCallback(
    (next: RunFieldInputValue) => {
      setValue("distanceKilometres", next.distanceKilometres, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("durationHours", next.durationHours, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("durationMinutes", next.durationMinutes, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("durationSeconds", next.durationSeconds, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("pacePerKilometre", next.pacePerKilometre, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("derivedMetric", next.derivedMetric, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

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
