import type { ReactNode } from "react";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  label: string;
}

export function FormField({ children, error, label }: FormFieldProps) {
  return (
    <label className="block text-sm font-medium text-zinc-800">
      <span>{label}</span>
      <span className="mt-1 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-sm text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
