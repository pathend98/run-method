import type { FocusEventHandler } from "react";

import { FormField } from "../form-field/form-field";
import styles from "./duration-input.module.css";

export type DurationInputValue = {
  hours: string;
  minutes: string;
  seconds: string;
};

type DurationInputProps = {
  autoFocus?: boolean;
  disabled?: boolean;
  displayValue?: DurationInputValue;
  error?: string;
  inputLabel?: string;
  label: string;
  onBlur?: FocusEventHandler<HTMLSpanElement>;
  onChange: (value: DurationInputValue) => void;
  onFocus?: FocusEventHandler<HTMLSpanElement>;
  value: DurationInputValue;
};

export function DurationInput({
  autoFocus = false,
  disabled = false,
  displayValue,
  error,
  label,
  inputLabel = label,
  onBlur,
  onChange,
  onFocus,
  value,
}: DurationInputProps) {
  const visibleValue = displayValue ?? value;

  return (
    <FormField error={error} label={label}>
      <span className={styles.inputs} onBlur={onBlur} onFocus={onFocus}>
        <input
          aria-label={`${inputLabel} hours`}
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...value, hours: event.target.value })
          }
          placeholder="hh"
          value={visibleValue.hours}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label={inputLabel.replace(
            /\(hh:mm:ss(, optional)?\)/,
            "(minutes$1)",
          )}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) =>
            onChange({ ...value, minutes: event.target.value })
          }
          placeholder="mm"
          value={visibleValue.minutes}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label={`${inputLabel} seconds`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) =>
            onChange({ ...value, seconds: event.target.value })
          }
          placeholder="ss"
          value={visibleValue.seconds}
        />
      </span>
    </FormField>
  );
}
