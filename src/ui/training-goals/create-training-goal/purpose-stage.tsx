import { useFormContext } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { FormField } from "@/ui/shared/form-field/form-field";

export function PurposeStage() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateTrainingGoalRequest>();
  return (
    <div className="space-y-4">
      <p id="purpose-guidance" className="text-zinc-600">
        Describe your reason for training. You might be preparing for a race,
        rebuilding fitness, or becoming more consistent.
      </p>
      <FormField
        label="What do you want this period of training to help you develop?"
        error={errors.purpose?.message}
      >
        <textarea
          className="min-h-32"
          aria-describedby="purpose-guidance"
          aria-invalid={Boolean(errors.purpose)}
          {...register("purpose")}
        />
      </FormField>
    </div>
  );
}
