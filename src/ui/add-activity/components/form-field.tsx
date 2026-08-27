import type { ReactNode } from "react";

import styles from "./form-field.module.css";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  label: string;
}

export function FormField({ children, error, label }: FormFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <span className={styles.control}>{children}</span>
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
