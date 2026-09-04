import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { CompleteTrainingSessionRequest, TrainingSession } from "@/domain/training-sessions";
import { DurationFormInput } from "@/ui/components/duration-form-input";
import { RunFieldFormInput } from "@/ui/run-field-input/run-field-form-input";
import { durationSecondsToFields } from "@/ui/training-sessions/duration-fields";
import { formatPace } from "@/ui/training-sessions/training-session-metric-formatters";
import {
  calculatePaceSecondsPerKilometre,
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
  const form = useForm<CompleteActivityFormValues>({
    defaultValues: defaultValues(activity),
    resolver: zodResolver(createCompleteActivityFormSchema(activity)),
  });
  const { formState: { errors }, handleSubmit, setError } = form;

  async function submit(values: CompleteActivityFormValues) {
    try {
      await onComplete(toCompleteTrainingSessionRequest(activity, values));
    } catch {
      setError("root", { message: "Unable to complete activity. Please try again." });
    }
  }

  return (
    <FormProvider {...form}>
      <form id="complete-activity-form" noValidate onSubmit={handleSubmit(submit)}>
        {errors.root ? <p className="mt-4 text-sm text-red-700" role="alert">{errors.root.message}</p> : null}
        <fieldset className="mt-6" disabled={isSubmitting}>
          {activity.activityType === "RUN" ? (
            <RunFieldFormInput disabled={isSubmitting} onPendingChange={onRunFieldsPendingChange} />
          ) : (
            <DurationFormInput autoFocus disabled={isSubmitting} label="Actual duration (hh:mm:ss)" />
          )}
        </fieldset>
      </form>
    </FormProvider>
  );
}

function defaultValues(activity: TrainingSession): CompleteActivityFormValues {
  const duration = durationSecondsToFields(activity.targetDurationSeconds);
  if (activity.activityType !== "RUN") {
    return { ...duration, derivedMetric: null, distanceKilometres: "", pacePerKilometre: "" };
  }
  return {
    ...duration,
    derivedMetric: "pace",
    distanceKilometres: (activity.targetDistanceMetres / 1000).toFixed(1),
    pacePerKilometre: formatPace(calculatePaceSecondsPerKilometre(activity.targetDistanceMetres, activity.targetDurationSeconds), { includeUnit: false }),
  };
}
