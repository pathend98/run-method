import { useFormContext } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { FormField } from "@/ui/shared/form-field/form-field";

export function IntentionsStage() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateTrainingGoalRequest>();
  return (
    <div className="space-y-4">
      <p id="intentions-guidance" className="text-zinc-600">
        Describe the actions within your control. For example: train
        consistently, recover well, and build gradually.
      </p>
      <FormField
        label="How will you approach your training?"
        error={errors.trainingIntentions?.message}
      >
        <textarea
          className="min-h-32"
          aria-describedby="intentions-guidance"
          aria-invalid={Boolean(errors.trainingIntentions)}
          {...register("trainingIntentions")}
        />
      </FormField>
    </div>
  );
}
