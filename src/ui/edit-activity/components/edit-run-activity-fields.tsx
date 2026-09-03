import { useFormContext, useWatch } from "react-hook-form";

import {
  RunFieldInput,
  type RunFieldInputValue,
} from "@/ui/run-field-input/run-field-input";
import type { EditActivityFormValues } from "../utils/edit-activity-form-schema";

type EditRunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function EditRunActivityFields({
  onPendingChange,
}: EditRunActivityFieldsProps) {
  const {
    control,
    formState: { errors, isSubmitted },
    setValue,
    trigger,
  } = useFormContext<EditActivityFormValues>();
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
    const fieldNames = [
      "distanceKilometres",
      "durationHours",
      "durationMinutes",
      "durationSeconds",
      "pacePerKilometre",
      "derivedMetric",
    ] as const;

    for (const fieldName of fieldNames) {
      setValue(fieldName, next[fieldName], {
        shouldDirty: next[fieldName] !== value[fieldName],
      });
    }
    if (isSubmitted) void trigger(fieldNames);
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
