import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { defaultDurationFields } from "@/ui/training-sessions/duration-fields";
import { DurationInput } from "@/ui/components/duration-input";
import { FormField } from "@/ui/components/form-field";
import {
  RunFieldInput,
  type RunFieldInputValue,
} from "@/ui/run-field-input/run-field-input";
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
  onRunFieldsPendingChange?: (pending: boolean) => void;
  onSkip: (request: SkipTrainingSessionRequest) => Promise<unknown>;
};

function doNothing() {}

export function ActivityTransitionForm({
  activity,
  isSubmitting,
  mode,
  onComplete,
  onRunFieldsPendingChange = doNothing,
  onSkip,
}: ActivityTransitionFormProps) {
  const isSkipping = mode === "skip";
  const form = useForm<ActivityTransitionFormValues>({
    defaultValues: {
      derivedMetric: null,
      distanceKilometres: "",
      ...defaultDurationFields,
      pacePerKilometre: "",
      skipReason: "",
    },
    resolver: zodResolver(createActivityTransitionFormSchema(activity, mode)),
  });
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setError,
    setValue,
    trigger,
  } = form;
  const runFields = useWatch({
    control,
    name: [
      "distanceKilometres",
      "durationHours",
      "durationMinutes",
      "durationSeconds",
      "pacePerKilometre",
      "derivedMetric",
    ],
  });
  const runValue: RunFieldInputValue = {
    distanceKilometres: runFields[0],
    durationHours: runFields[1],
    durationMinutes: runFields[2],
    durationSeconds: runFields[3],
    pacePerKilometre: runFields[4],
    derivedMetric: runFields[5],
  };

  function changeRunValue(next: RunFieldInputValue) {
    const fieldNames = [
      "distanceKilometres",
      "durationHours",
      "durationMinutes",
      "durationSeconds",
      "pacePerKilometre",
      "derivedMetric",
    ] as const;

    for (const fieldName of fieldNames) {
      setValue(fieldName, next[fieldName], {
        shouldDirty: next[fieldName] !== runValue[fieldName],
      });
    }
    if (isSubmitted) void trigger(fieldNames);
  }

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
      ) : activity.activityType === "RUN" ? (
        <fieldset disabled={isSubmitting}>
          <RunFieldInput
            disabled={isSubmitting}
            errors={{
              distance: errors.distanceKilometres?.message,
              duration:
                errors.durationHours?.message ??
                errors.durationMinutes?.message ??
                errors.durationSeconds?.message,
              pace: errors.pacePerKilometre?.message,
            }}
            onChange={changeRunValue}
            onPendingChange={onRunFieldsPendingChange}
            value={runValue}
          />
        </fieldset>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <DurationInput autoFocus error={errors.durationHours?.message ?? errors.durationMinutes?.message ?? errors.durationSeconds?.message} disabled={isSubmitting} hoursName="durationHours" label="Actual duration (hh:mm:ss)" minutesName="durationMinutes" register={register} secondsName="durationSeconds" />
        </div>
      )}
    </form>
  );
}
