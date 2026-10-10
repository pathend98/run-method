import { useFormContext, useWatch } from "react-hook-form";

import { RunFieldInput } from "./run-field-input";
import type { RunningMetricInput as RunFieldInputValue } from "../run-metric-input-model";

export type {
  RunningMetricInput as RunFieldInputValue,
  RunningMetric as RunFieldMetric,
} from "../run-metric-input-model";

export type RunFieldFormInputProps = {
  disabled?: boolean;
  onPendingChange?: (pending: boolean) => void;
};

const fieldNames = [
  "distance",
  "durationHours",
  "durationMinutes",
  "durationSeconds",
  "pace",
  "derivedMetric",
] as const;

export function RunFieldFormInput({
  disabled = false,
  onPendingChange,
}: RunFieldFormInputProps) {
  const {
    control,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<RunFieldInputValue>();
  const fields = useWatch({ control, name: fieldNames });
  const value: RunFieldInputValue = {
    distance: fields[0],
    durationHours: fields[1],
    durationMinutes: fields[2],
    durationSeconds: fields[3],
    pace: fields[4],
    derivedMetric: fields[5],
  };

  function changeValue(next: RunFieldInputValue) {
    for (const fieldName of fieldNames) {
      setValue(fieldName, next[fieldName], {
        shouldDirty: next[fieldName] !== value[fieldName],
      });
    }
  }

  function validateFields(
    fieldsToValidate: readonly (typeof fieldNames)[number][],
  ) {
    void trigger(fieldsToValidate);
  }

  return (
    <RunFieldInput
      disabled={disabled}
      errors={{
        distance: errors.distance?.message,
        duration:
          errors.durationHours?.message ??
          errors.durationMinutes?.message ??
          errors.durationSeconds?.message,
        pace: errors.pace?.message,
      }}
      onChange={changeValue}
      onMetricBlur={(metric) => {
        if (metric === "distance") validateFields(["distance"]);
        if (metric === "duration") {
          validateFields([
            "durationHours",
            "durationMinutes",
            "durationSeconds",
          ]);
        }
        if (metric === "pace") validateFields(["pace"]);
      }}
      onPendingChange={onPendingChange}
      value={value}
    />
  );
}
