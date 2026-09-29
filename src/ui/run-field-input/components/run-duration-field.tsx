import { useState, type FocusEvent } from "react";

import {
  DurationInput,
  type DurationInputValue,
} from "@/ui/components/duration-input";
import type { RunningMetricInput as RunFieldInputValue } from "@/ui/running-metrics/running-metrics";

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

  function changeDuration(next: DurationInputValue) {
    setEdited(true);
    onChange({
      ...value,
      durationHours: next.hours,
      durationMinutes: next.minutes,
      durationSeconds: next.seconds,
    });
  }

  function finishEdit(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onAutoEditEnd();
    }
  }

  return (
    <DurationInput
      disabled={disabled}
      displayValue={{
        hours: showValue ? value.durationHours : "",
        minutes: showValue ? value.durationMinutes : "",
        seconds: showValue ? value.durationSeconds : "",
      }}
      error={error}
      inputLabel="Duration (hh:mm:ss)"
      label={auto ? "Duration (hh:mm:ss) · Auto" : "Duration (hh:mm:ss)"}
      onBlur={finishEdit}
      onChange={changeDuration}
      onFocus={onAutoEditStart}
      value={{
        hours: value.durationHours,
        minutes: value.durationMinutes,
        seconds: value.durationSeconds,
      }}
    />
  );
}

function isZeroDuration(value: RunFieldInputValue) {
  return (
    value.durationHours === "00" &&
    value.durationMinutes === "00" &&
    value.durationSeconds === "00"
  );
}
