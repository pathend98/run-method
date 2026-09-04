import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import {
  skipActivityFormSchema,
  toSkipTrainingSessionRequest,
  type SkipActivityFormValues,
} from "../utils/skip-activity-form";

type SkipActivityFormProps = {
  isSubmitting: boolean;
  onSkip: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

export function SkipActivityForm({
  isSubmitting,
  onSkip,
}: SkipActivityFormProps) {
  const form = useForm<SkipActivityFormValues>({
    defaultValues: { skipReason: "" },
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
      <form id="skip-activity-form" noValidate onSubmit={handleSubmit(submit)}>
        <h3 className="mt-6 text-base font-semibold text-zinc-950">
          Why are you skipping this activity?
        </h3>
        {errors.root ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="mt-4" disabled={isSubmitting}>
          <FormField error={errors.skipReason?.message} label="Skip reason">
            <textarea
              aria-label="Skip reason"
              autoFocus
              className="min-h-24"
              disabled={isSubmitting}
              placeholder="Tell us why you're skipping this workout..."
              {...register("skipReason")}
            />
          </FormField>
          <p className="mt-2 text-sm text-zinc-600">Required</p>
        </fieldset>
      </form>
    </FormProvider>
  );
}
