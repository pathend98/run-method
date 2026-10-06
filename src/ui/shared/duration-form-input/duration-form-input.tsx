import type { FocusEvent } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DurationInput, type DurationInputValue } from "./duration-input";
import type { DurationFields } from "./duration-fields";

type DurationFormInputProps = {
  autoFocus?: boolean;
  disabled?: boolean;
  label: string;
};

const fieldNames = [
  "durationHours",
  "durationMinutes",
  "durationSeconds",
] as const;

export function DurationFormInput({
  autoFocus = false,
  disabled = false,
  label,
}: DurationFormInputProps) {
  const {
    control,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<DurationFields>();
  const fields = useWatch({ control, name: fieldNames });
  const currentFields: DurationFields = {
    durationHours: fields[0],
    durationMinutes: fields[1],
    durationSeconds: fields[2],
  };
  const value: DurationInputValue = {
    hours: currentFields.durationHours,
    minutes: currentFields.durationMinutes,
    seconds: currentFields.durationSeconds,
  };

  function changeValue(next: DurationInputValue) {
    const nextFields: DurationFields = {
      durationHours: next.hours,
      durationMinutes: next.minutes,
      durationSeconds: next.seconds,
    };
    for (const fieldName of fieldNames) {
      setValue(fieldName, nextFields[fieldName], {
        shouldDirty: nextFields[fieldName] !== currentFields[fieldName],
      });
    }
  }

  function validateDuration(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      void trigger(fieldNames);
    }
  }

  return (
    <DurationInput
      autoFocus={autoFocus}
      disabled={disabled}
      error={
        errors.durationHours?.message ??
        errors.durationMinutes?.message ??
        errors.durationSeconds?.message
      }
      label={label}
      onBlur={validateDuration}
      onChange={changeValue}
      value={value}
    />
  );
}
