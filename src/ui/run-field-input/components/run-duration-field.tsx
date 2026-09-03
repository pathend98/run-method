import { useState, type FocusEvent } from "react";

import { FormField } from "@/ui/components/form-field";
import styles from "../run-field-input.module.css";
import type { RunFieldInputValue } from "../utils/run-field-calculations";

type RunDurationFieldProps = {
  auto: boolean;
  disabled: boolean;
  error?: string;
  onAutoEditEnd: () => void;
  onAutoEditStart: () => void;
  onChange: (value: RunFieldInputValue) => void;
  value: RunFieldInputValue;
};

export function RunDurationField({
  auto,
  disabled,
  error,
  onAutoEditEnd,
  onAutoEditStart,
  onChange,
  value,
}: RunDurationFieldProps) {
  const [edited, setEdited] = useState(() => !isZeroDuration(value));
  const showValue = edited || !isZeroDuration(value);

  function changeDuration(
    field: "durationHours" | "durationMinutes" | "durationSeconds",
    next: string,
  ) {
    setEdited(true);
    onChange({ ...value, [field]: next });
  }

  function finishEdit(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onAutoEditEnd();
    }
  }

  return (
    <FormField
      error={error}
      label={auto ? "Duration (hh:mm:ss) · Auto" : "Duration (hh:mm:ss)"}
    >
      <span
        className={styles.durationInputs}
        onBlur={finishEdit}
        onFocus={onAutoEditStart}
      >
        <input
          aria-label="Duration (hh:mm:ss) hours"
          disabled={disabled}
          inputMode="numeric"
          onChange={(event) =>
            changeDuration("durationHours", event.target.value)
          }
          placeholder="hh"
          value={showValue ? value.durationHours : ""}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label="Duration (minutes)"
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) =>
            changeDuration("durationMinutes", event.target.value)
          }
          placeholder="mm"
          value={showValue ? value.durationMinutes : ""}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label="Duration (hh:mm:ss) seconds"
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) =>
            changeDuration("durationSeconds", event.target.value)
          }
          placeholder="ss"
          value={showValue ? value.durationSeconds : ""}
        />
      </span>
    </FormField>
  );
}

function isZeroDuration(value: RunFieldInputValue) {
  return (
    value.durationHours === "00" &&
    value.durationMinutes === "00" &&
    value.durationSeconds === "00"
  );
}
