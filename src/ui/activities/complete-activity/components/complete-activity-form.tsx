import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import { DurationFormInput } from "@/ui/shared/duration-form-input/duration-form-input";
import { RunFieldFormInput } from "@/ui/runs/run-field-form-input/run-field-form-input";
import { durationSecondsToFields } from "@/ui/training-sessions/duration-fields";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import {
  createCompleteActivityFormSchema,
  toCompleteTrainingSessionRequest,
  type CompleteActivityFormValues,
} from "../utils/complete-activity-form";

type CompleteActivityFormProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  onComplete: (request: CompleteTrainingSessionRequest) => Promise<unknown>;
  onRunFieldsPendingChange: (pending: boolean) => void;
};

export function CompleteActivityForm({
  activity,
  isSubmitting,
  onComplete,
  onRunFieldsPendingChange,
}: CompleteActivityFormProps) {
  const unit = useDistanceDisplayUnit();
  const form = useForm<CompleteActivityFormValues>({
    defaultValues: defaultValues(activity, unit),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(createCompleteActivityFormSchema(activity, unit)),
  });
  const {
    formState: { errors },
    handleSubmit,
    setError,
  } = form;

  async function submit(values: CompleteActivityFormValues) {
    try {
      await onComplete(
        toCompleteTrainingSessionRequest(activity, values, unit),
      );
    } catch {
      setError("root", {
        message: "Unable to complete activity. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        id="complete-activity-form"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {errors.root ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="mt-6" disabled={isSubmitting}>
          {activity.activityType === "RUN" ? (
            <RunFieldFormInput
              disabled={isSubmitting}
              onPendingChange={onRunFieldsPendingChange}
            />
          ) : (
            <DurationFormInput
              autoFocus
              disabled={isSubmitting}
              label="Actual duration (hh:mm:ss)"
            />
          )}
        </fieldset>
      </form>
    </FormProvider>
  );
}

function defaultValues(
  activity: TrainingSession,
  unit: RunningMetricUnit,
): CompleteActivityFormValues {
  const duration = durationSecondsToFields(activity.targetDurationSeconds);
  if (activity.activityType !== "RUN") {
    return {
      ...duration,
      derivedMetric: null,
      distance: "",
      pace: "",
    };
  }
  return {
    ...duration,
    derivedMetric: "pace",
    ...new RunningMetrics(unit).prefill(
      activity.targetDistanceMetres,
      activity.targetDurationSeconds,
    ),
  };
}
