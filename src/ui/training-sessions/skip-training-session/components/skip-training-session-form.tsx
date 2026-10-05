import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { SkipTrainingSessionRequest } from "@/domain/training-sessions";
import { FormField } from "@/ui/shared/form-field/form-field";
import {
  skipTrainingSessionFormSchema,
  toSkipTrainingSessionRequest,
  type SkipTrainingSessionFormValues,
} from "../utils/skip-training-session-form";

type SkipTrainingSessionFormProps = {
  isSubmitting: boolean;
  onSkip: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

export function SkipTrainingSessionForm({
  isSubmitting,
  onSkip,
}: SkipTrainingSessionFormProps) {
  const form = useForm<SkipTrainingSessionFormValues>({
    defaultValues: { skipReason: "" },
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(skipTrainingSessionFormSchema),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;

  async function submit(values: SkipTrainingSessionFormValues) {
    try {
      await onSkip(toSkipTrainingSessionRequest(values));
    } catch {
      setError("root", {
        message: "Unable to skip training session. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        id="skip-training-session-form"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {errors.root ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="mt-4" disabled={isSubmitting}>
          <FormField
            error={errors.skipReason?.message}
            label="Why are you skipping this training session?"
          >
            <textarea
              aria-label="Why are you skipping this training session?"
              autoFocus
              className="min-h-24"
              disabled={isSubmitting}
              placeholder="Tell us why you're skipping this training session..."
              {...register("skipReason")}
            />
          </FormField>
        </fieldset>
      </form>
    </FormProvider>
  );
}
