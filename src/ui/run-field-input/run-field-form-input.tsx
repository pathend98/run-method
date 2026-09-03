import { useFormContext, useWatch } from "react-hook-form";

import { RunFieldInput } from "./components/run-field-input";
import type { RunFieldInputValue } from "./utils/run-field-calculations";

export type { RunFieldInputValue, RunFieldMetric } from "./utils/run-field-calculations";
export { calculateDerivedMetric } from "./utils/run-field-calculations";

type RunFieldFormInputProps = {
  disabled?: boolean;
  onPendingChange?: (pending: boolean) => void;
};

const fieldNames = [
  "distanceKilometres",
  "durationHours",
  "durationMinutes",
  "durationSeconds",
  "pacePerKilometre",
  "derivedMetric",
] as const;

export function RunFieldFormInput({
  disabled = false,
  onPendingChange,
}: RunFieldFormInputProps) {
  const {
    control,
    formState: { errors, isSubmitted },
    setValue,
    trigger,
  } = useFormContext<RunFieldInputValue>();
  const fields = useWatch({ control, name: fieldNames });
  const value: RunFieldInputValue = {
    distanceKilometres: fields[0],
    durationHours: fields[1],
    durationMinutes: fields[2],
    durationSeconds: fields[3],
    pacePerKilometre: fields[4],
    derivedMetric: fields[5],
  };

  function changeValue(next: RunFieldInputValue) {
    for (const fieldName of fieldNames) {
      setValue(fieldName, next[fieldName], {
        shouldDirty: next[fieldName] !== value[fieldName],
      });
    }
    if (isSubmitted) void trigger(fieldNames);
  }

  return (
    <RunFieldInput
      disabled={disabled}
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
