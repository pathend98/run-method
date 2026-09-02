import type { FieldValues, Path, UseFormRegister } from "react-hook-form";

import { FormField } from "./form-field";
import styles from "./duration-input.module.css";

type DurationInputProps<TFormValues extends FieldValues> = {
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  hoursName: Path<TFormValues>;
  label: string;
  minutesName: Path<TFormValues>;
  register: UseFormRegister<TFormValues>;
  secondsName: Path<TFormValues>;
};

export function DurationInput<TFormValues extends FieldValues>({
  autoFocus = false,
  disabled = false,
  error,
  hoursName,
  label,
  minutesName,
  register,
  secondsName,
}: DurationInputProps<TFormValues>) {
  return (
    <FormField error={error} label={label}>
      <span className={styles.inputs}>
        <input
          aria-label={`${label} hours`}
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode="numeric"
          placeholder="hh"
          {...register(hoursName)}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label={label.replace(/\(hh:mm:ss(, optional)?\)/, "(minutes$1)")}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          placeholder="mm"
          {...register(minutesName)}
        />
        <span aria-hidden="true">:</span>
        <input
          aria-label={`${label} seconds`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          placeholder="ss"
          {...register(secondsName)}
        />
      </span>
    </FormField>
  );
}
