import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import { EditRunActivityFields } from "./components/edit-run-activity-fields";
import { ReadOnlyDetail } from "./components/read-only-detail";
import {
  createEditActivityFormSchema,
  getEditActivityFormValues,
  toEditTrainingSessionRequest,
  type EditActivityFormValues,
} from "./utils/edit-activity-form";

type EditActivityModalProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  onClose: () => void;
  onEdit: (request: EditTrainingSessionRequest) => Promise<unknown>;
};

export function EditActivityModal({
  activity,
  isSubmitting,
  onClose,
  onEdit,
}: EditActivityModalProps) {
  const form = useForm<EditActivityFormValues>({
    defaultValues: getEditActivityFormValues(activity),
    resolver: zodResolver(createEditActivityFormSchema(activity)),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;
  const isScheduled = activity.status === "SCHEDULED";

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  async function submit(values: EditActivityFormValues) {
    try {
      await onEdit(toEditTrainingSessionRequest(values, activity));
      onClose();
    } catch {
      setError("root", {
        message: "Unable to edit activity. Please try again.",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Dismiss edit activity"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        disabled={isSubmitting}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="edit-activity-title"
        aria-modal="true"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {formatActivityType(activity)} · {activity.date}
            </p>
            <h2
              className="text-xl font-semibold text-zinc-950"
              id="edit-activity-title"
            >
              Edit activity
            </h2>
          </div>
          <button
            aria-label="Close edit activity"
            className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-zinc-50 p-3 text-sm">
          <ReadOnlyDetail
            label="Activity type"
            value={formatActivityType(activity)}
          />
          <ReadOnlyDetail
            label="Status"
            value={formatStatus(activity.status)}
          />
          {!isScheduled ? (
            <ReadOnlyDetail
              label="Time of day"
              value={activity.timeOfDay ?? "Any time"}
            />
          ) : null}
          {activity.activityType === "RUN" ? (
            <ReadOnlyDetail
              label="Run target"
              value={formatTargetType(activity.targetType)}
            />
          ) : null}
          {shouldShowLockedTargets(activity) ? (
            <ReadOnlyDetail
              label="Target details"
              value={formatLockedTargets(activity)}
            />
          ) : null}
        </dl>

        <FormProvider {...form}>
          <form
            className="mt-6 space-y-4"
            noValidate
            onSubmit={handleSubmit(submit)}
          >
            {errors.root ? (
              <p
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {errors.root.message}
              </p>
            ) : null}
            <FormField error={errors.title?.message} label="Title">
              <input autoFocus {...register("title")} />
            </FormField>
            {isScheduled ? (
              <FormField label="Time of day">
                <select {...register("timeOfDay")}>
                  <option value="ANY">Any time</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </FormField>
            ) : null}
            {isScheduled && activity.activityType === "RUN" ? (
              <EditRunActivityFields targetType={activity.targetType} />
            ) : null}
            <FormField label="Description (optional)">
              <textarea className="min-h-24" {...register("description")} />
            </FormField>
            <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </FormProvider>
      </section>
    </div>
  );
}

function shouldShowLockedTargets(activity: TrainingSession) {
  return (
    activity.activityType === "STRENGTH" || activity.status !== "SCHEDULED"
  );
}

function formatLockedTargets(activity: TrainingSession) {
  if (activity.activityType === "STRENGTH") {
    return (
      formatDuration(activity.targetDurationSeconds) ?? "No target duration"
    );
  }

  const values = [
    formatDistance(activity.targetDistanceMetres),
    formatDuration(activity.targetDurationSeconds),
    formatPace(activity.targetPaceSecondsPerKilometre),
  ].filter((value): value is string => value !== null);
  return values.join(" · ");
}

function formatActivityType(activity: TrainingSession) {
  return activity.activityType === "RUN" ? "Run" : "Strength";
}

function formatStatus(status: TrainingSession["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}

function formatDistance(metres: number | null) {
  return metres === null ? null : `${metres / 1000} km`;
}

function formatDuration(seconds: number | null) {
  return seconds === null ? null : `${seconds / 60} min`;
}

function formatPace(secondsPerKilometre: number | null) {
  if (secondsPerKilometre === null) return null;
  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds} / km`;
}
