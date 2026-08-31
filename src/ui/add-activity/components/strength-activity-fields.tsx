import { useFormContext } from "react-hook-form";

import { FormField } from "@/ui/components/form-field";
import type { AddActivityFormValues } from "../utils/add-activity-form";

export function StrengthActivityFields() {
  const {
    formState: { errors },
    register,
  } = useFormContext<AddActivityFormValues>();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        error={errors.durationMinutes?.message}
        label="Duration (minutes, optional)"
      >
        <input
          inputMode="numeric"
          placeholder="45"
          {...register("durationMinutes")}
        />
      </FormField>
    </div>
  );
}
