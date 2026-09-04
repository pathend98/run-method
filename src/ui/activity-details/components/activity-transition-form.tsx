import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import {
  skipActivityFormSchema,
  toSkipTrainingSessionRequest,
  type SkipActivityFormValues,
} from "../utils/activity-transition-form";

type ActivityTransitionFormProps = {
  isSubmitting: boolean;
  onSkip: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

export function ActivityTransitionForm({
  isSubmitting,
  onSkip,
}: ActivityTransitionFormProps) {
  const form = useForm<SkipActivityFormValues>({
    defaultValues: {
      skipReason: "",
    },
    resolver: zodResolver(skipActivityFormSchema),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;
  async function submit(values: SkipActivityFormValues) {
    try {
      await onSkip(toSkipTrainingSessionRequest(values));
    } catch {
      setError("root", {
        message: "Unable to skip activity. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        className="mt-6 space-y-4 rounded-lg border border-teal-200 bg-teal-50 p-4"
        id="activity-transition-form"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        <h3 className="text-sm font-semibold text-zinc-950">
          Skip activity
        </h3>
        {errors.root ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <FormField error={errors.skipReason?.message} label="Skip reason">
          <textarea
            aria-label="Skip reason"
            autoFocus
            className="min-h-24"
            disabled={isSubmitting}
            {...register("skipReason")}
          />
        </FormField>
      </form>
    </FormProvider>
  );
}
