import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import type { RunningMetricUnit } from "@/ui/runs/run-metrics";
import { Button } from "@/ui/shared/button/button";
import { FormField } from "@/ui/shared/form-field/form-field";
import { DurationFormInput } from "@/ui/shared/duration-form-input";
import {
  createTrainingGoalFormSchema,
  defaultTrainingGoalFormValues,
  toCreateTrainingGoalRequest,
  type TrainingGoalFormValues,
} from "../utils/training-goal-form";

type TrainingGoalFormProps = {
  unit: RunningMetricUnit;
  onSubmit: (request: CreateTrainingGoalRequest) => Promise<void>;
};

export function TrainingGoalForm({ unit, onSubmit }: TrainingGoalFormProps) {
  const form = useForm<TrainingGoalFormValues>({
    defaultValues: defaultTrainingGoalFormValues,
    resolver: zodResolver(createTrainingGoalFormSchema(unit)),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function submit(values: TrainingGoalFormValues) {
    try {
      await onSubmit(toCreateTrainingGoalRequest(values, unit));
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
          <FormField label="Goal type" error={errors.type?.message}>
            <select {...register("type")}>
              <option value="RACE">Race</option>
              <option value="DISTANCE">Distance</option>
              <option value="CONSISTENCY">Consistency</option>
              <option value="OPEN">Open</option>
            </select>
          </FormField>
          <FormField
            label="Description (optional)"
            error={errors.description?.message}
          >
            <textarea className="min-h-24" {...register("description")} />
          </FormField>
          <FormField
            label="Target date (optional)"
            error={errors.targetDate?.message}
          >
            <input type="date" {...register("targetDate")} />
          </FormField>
          <FormField
            label={`Target distance (${unit === "MILES" ? "mi" : "km"}, optional)`}
            error={errors.distance?.message}
          >
            <input inputMode="decimal" {...register("distance")} />
          </FormField>
          <DurationFormInput
            label="Target time (hh:mm:ss, optional)"
            disabled={isSubmitting}
          />
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create training goal"}
          </Button>
        </fieldset>
      </form>
    </FormProvider>
  );
}
