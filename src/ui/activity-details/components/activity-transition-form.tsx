import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import {
  createActivityTransitionFormSchema,
  toCompleteTrainingSessionRequest,
  toSkipTrainingSessionRequest,
  type ActivityTransitionFormValues,
} from "../utils/activity-transition-form";

type ActivityTransitionFormProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  mode: "complete" | "skip";
  onComplete: (request: CompleteTrainingSessionRequest) => Promise<unknown>;
  onSkip: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

export function ActivityTransitionForm({
  activity,
  isSubmitting,
  mode,
  onComplete,
  onSkip,
}: ActivityTransitionFormProps) {
  const isSkipping = mode === "skip";
  const form = useForm<ActivityTransitionFormValues>({
    defaultValues: {
      distanceKilometres: "",
      durationMinutes: "",
      skipReason: "",
    },
    resolver: zodResolver(createActivityTransitionFormSchema(activity, mode)),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;

  async function submit(values: ActivityTransitionFormValues) {
    try {
      if (isSkipping) {
        await onSkip(toSkipTrainingSessionRequest(values));
      } else {
        await onComplete(toCompleteTrainingSessionRequest(activity, values));
      }
    } catch {
      setError("root", {
        message: isSkipping
          ? "Unable to skip activity. Please try again."
          : "Unable to complete activity. Please try again.",
      });
    }
  }

  return (
    <form
      className="mt-6 space-y-4 rounded-lg border border-teal-200 bg-teal-50 p-4"
      id="activity-transition-form"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <h3 className="text-sm font-semibold text-zinc-950">
        {isSkipping ? "Skip activity" : "Complete activity"}
      </h3>
      {errors.root ? (
        <p className="text-sm text-red-700" role="alert">
          {errors.root.message}
        </p>
      ) : null}
      {isSkipping ? (
        <FormField error={errors.skipReason?.message} label="Skip reason">
          <textarea
            aria-label="Skip reason"
            autoFocus
            className="min-h-24"
            disabled={isSubmitting}
            {...register("skipReason")}
          />
        </FormField>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            error={errors.durationMinutes?.message}
            label="Actual duration (minutes)"
          >
            <input
              aria-label="Actual duration (minutes)"
              autoFocus
              disabled={isSubmitting}
              inputMode="numeric"
              {...register("durationMinutes")}
            />
          </FormField>
          {activity.activityType === "RUN" ? (
            <FormField
              error={errors.distanceKilometres?.message}
              label="Actual distance (km)"
            >
              <input
                aria-label="Actual distance (km)"
                disabled={isSubmitting}
                inputMode="decimal"
                {...register("distanceKilometres")}
              />
            </FormField>
          ) : null}
        </div>
      )}
    </form>
  );
}
