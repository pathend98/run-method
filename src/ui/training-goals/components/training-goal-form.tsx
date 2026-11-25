import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { Button } from "@/ui/shared/button/button";
import { FormField } from "@/ui/shared/form-field/form-field";
import {
  trainingGoalFormSchema,
  defaultTrainingGoalFormValues,
} from "../form/training-goal-form";

type TrainingGoalFormProps = {
  onSubmit: (request: CreateTrainingGoalRequest) => Promise<void>;
};

export function TrainingGoalForm({ onSubmit }: TrainingGoalFormProps) {
  const form = useForm<CreateTrainingGoalRequest>({
    defaultValues: defaultTrainingGoalFormValues,
    resolver: zodResolver(trainingGoalFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function submit(values: CreateTrainingGoalRequest) {
    try {
      await onSubmit(values);
    } catch {
      setError("root", {
        message: "Unable to create training goal. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        className="max-w-xl space-y-4"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {errors.root ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="space-y-4" disabled={isSubmitting}>
          <FormField label="Title" error={errors.title?.message}>
            <input {...register("title")} />
          </FormField>
          <FormField label="Purpose" error={errors.purpose?.message}>
            <textarea className="min-h-24" {...register("purpose")} />
          </FormField>
          <FormField
            label="Training intentions"
            error={errors.trainingIntentions?.message}
          >
            <textarea
              className="min-h-24"
              {...register("trainingIntentions")}
            />
          </FormField>
          <FormField label="Start date" error={errors.startDate?.message}>
            <input type="date" {...register("startDate")} />
          </FormField>
          <FormField label="Target date" error={errors.targetDate?.message}>
            <input type="date" {...register("targetDate")} />
          </FormField>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create training goal"}
          </Button>
        </fieldset>
      </form>
    </FormProvider>
  );
}
