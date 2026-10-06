import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import {
  DurationFormInput,
  durationSecondsToFields,
} from "@/ui/shared/duration-form-input";
import { RunFieldFormInput } from "@/ui/runs/run-field-form-input/run-field-form-input";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import {
  createCompleteTrainingSessionFormSchema,
  toCompleteTrainingSessionRequest,
  type CompleteTrainingSessionFormValues,
} from "../utils/complete-training-session-form";

type CompleteTrainingSessionFormProps = {
  trainingSession: TrainingSession;
  isSubmitting: boolean;
  onComplete: (request: CompleteTrainingSessionRequest) => Promise<unknown>;
  onRunFieldsPendingChange: (pending: boolean) => void;
};

export function CompleteTrainingSessionForm({
  trainingSession,
  isSubmitting,
  onComplete,
  onRunFieldsPendingChange,
}: CompleteTrainingSessionFormProps) {
  const unit = useDistanceDisplayUnit();
  const form = useForm<CompleteTrainingSessionFormValues>({
    defaultValues: defaultValues(trainingSession, unit),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(
      createCompleteTrainingSessionFormSchema(trainingSession, unit),
    ),
  });
  const {
    formState: { errors },
    handleSubmit,
    setError,
  } = form;

  async function submit(values: CompleteTrainingSessionFormValues) {
    try {
      await onComplete(
        toCompleteTrainingSessionRequest(trainingSession, values, unit),
      );
    } catch {
      setError("root", {
        message: "Unable to complete training session. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        id="complete-training-session-form"
        noValidate
        onSubmit={handleSubmit(submit)}
      >
        {errors.root ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="mt-6" disabled={isSubmitting}>
          {trainingSession.activityType === "RUN" ? (
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
  trainingSession: TrainingSession,
  unit: RunningMetricUnit,
): CompleteTrainingSessionFormValues {
  const duration = durationSecondsToFields(
    trainingSession.targetDurationSeconds,
  );
  if (trainingSession.activityType !== "RUN") {
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
      trainingSession.targetDistanceMetres,
      trainingSession.targetDurationSeconds,
    ),
  };
}
