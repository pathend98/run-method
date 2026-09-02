import { useFormContext } from "react-hook-form";

import { DurationInput } from "@/ui/components/duration-input";
import type { AddActivityFormValues } from "../utils/add-activity-form";

export function StrengthActivityFields() {
  const {
    formState: { errors },
    register,
  } = useFormContext<AddActivityFormValues>();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DurationInput error={errors.durationHours?.message ?? errors.durationMinutes?.message ?? errors.durationSeconds?.message} hoursName="durationHours" label="Duration (hh:mm:ss, optional)" minutesName="durationMinutes" register={register} secondsName="durationSeconds" />
    </div>
  );
}
