import { useFormContext, useWatch } from "react-hook-form";

import { RunFieldInput } from "./components/run-field-input";
import type { RunFieldInputValue } from "./utils/run-field-calculations";

export type {
  RunFieldInputValue,
  RunFieldMetric,
} from "./utils/run-field-calculations";
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
    formState: { errors },
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
        distance: errors.distanceKilometres?.message,
        duration:
          errors.durationHours?.message ??
          errors.durationMinutes?.message ??
          errors.durationSeconds?.message,
        pace: errors.pacePerKilometre?.message,
      }}
      onChange={changeValue}
      onMetricBlur={(metric) => {
        if (metric === "distance") validateFields(["distanceKilometres"]);
        if (metric === "duration") {
          validateFields([
            "durationHours",
            "durationMinutes",
            "durationSeconds",
          ]);
        }
        if (metric === "pace") validateFields(["pacePerKilometre"]);
      }}
      onPendingChange={onPendingChange}
      value={value}
    />
  );
}
