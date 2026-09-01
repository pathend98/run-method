import { useState, type FormEvent } from "react";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import {
  createCompleteActivityFormSchema,
  skipActivityFormSchema,
  toCompleteTrainingSessionRequest,
  toSkipTrainingSessionRequest,
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
  const [skipReason, setSkipReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [distanceKilometres, setDistanceKilometres] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isSkipping = mode === "skip";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(null);
    const result = isSkipping
      ? skipActivityFormSchema.safeParse({ skipReason })
      : createCompleteActivityFormSchema(activity).safeParse({
          durationMinutes,
          distanceKilometres,
        });

    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }

    setFieldErrors({});
    try {
      if (isSkipping) {
        await onSkip(
          toSkipTrainingSessionRequest(result.data as { skipReason: string }),
        );
      } else {
        await onComplete(
          toCompleteTrainingSessionRequest(
            activity,
            result.data as {
              distanceKilometres: string;
              durationMinutes: string;
            },
          ),
        );
      }
    } catch {
      setSubmissionError(
        isSkipping
          ? "Unable to skip activity. Please try again."
          : "Unable to complete activity. Please try again.",
      );
    }
  }

  return (
    <form
      className="mt-6 space-y-4 rounded-lg border border-teal-200 bg-teal-50 p-4"
      id="activity-transition-form"
      noValidate
      onSubmit={submit}
    >
      <h3 className="text-sm font-semibold text-zinc-950">
        {isSkipping ? "Skip activity" : "Complete activity"}
      </h3>
      {submissionError ? (
        <p className="text-sm text-red-700" role="alert">
          {submissionError}
        </p>
      ) : null}
      {isSkipping ? (
        <FormField error={fieldErrors.skipReason} label="Skip reason">
          <textarea
            aria-label="Skip reason"
            autoFocus
            className="min-h-24"
            disabled={isSubmitting}
            onChange={(event) => setSkipReason(event.target.value)}
            value={skipReason}
          />
        </FormField>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            error={fieldErrors.durationMinutes}
            label="Actual duration (minutes)"
          >
            <input
              aria-label="Actual duration (minutes)"
              autoFocus
              disabled={isSubmitting}
              inputMode="numeric"
              onChange={(event) => setDurationMinutes(event.target.value)}
              value={durationMinutes}
            />
          </FormField>
          {activity.activityType === "RUN" ? (
            <FormField
              error={fieldErrors.distanceKilometres}
              label="Actual distance (km)"
            >
              <input
                aria-label="Actual distance (km)"
                disabled={isSubmitting}
                inputMode="decimal"
                onChange={(event) => setDistanceKilometres(event.target.value)}
                value={distanceKilometres}
              />
            </FormField>
          ) : null}
        </div>
      )}
    </form>
  );
}
