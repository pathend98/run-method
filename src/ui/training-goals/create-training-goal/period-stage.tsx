import { useFormContext } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { FormField } from "@/ui/shared/form-field/form-field";

export function PeriodStage() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateTrainingGoalRequest>();
  return (
    <div className="space-y-4">
      <FormField label="Goal name" error={errors.title?.message}>
        <input aria-invalid={Boolean(errors.title)} {...register("title")} />
      </FormField>
      <FormField label="Start date" error={errors.startDate?.message}>
        <input
          type="date"
          aria-invalid={Boolean(errors.startDate)}
          {...register("startDate")}
        />
      </FormField>
      <FormField label="Target date" error={errors.targetDate?.message}>
        <input
          type="date"
          aria-invalid={Boolean(errors.targetDate)}
          {...register("targetDate")}
        />
      </FormField>
    </div>
  );
}
