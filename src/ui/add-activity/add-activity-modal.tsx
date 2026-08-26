import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { CreateTrainingSessionRequest } from "@/domain/training-sessions";
import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  toCreateTrainingSessionRequest,
  type AddActivityFormValues,
} from "./utils/add-activity-form";
import { FormField } from "./components/form-field";

type AddActivityDay = {
  date: string;
  day: string;
};

type AddActivityModalProps = {
  day: AddActivityDay;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (request: CreateTrainingSessionRequest) => Promise<unknown>;
};

export function AddActivityModal({
  day,
  isSubmitting,
  onClose,
  onCreate,
}: AddActivityModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    watch,
  } = useForm<AddActivityFormValues>({
    defaultValues: defaultAddActivityFormValues,
    resolver: zodResolver(addActivityFormSchema),
  });
  const activityType = watch("activityType");
  const targetType = watch("targetType");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  async function submit(values: AddActivityFormValues) {
    try {
      await onCreate(toCreateTrainingSessionRequest(values, day.date));
      onClose();
    } catch {
      setError("root", {
        message: "Unable to add activity. Please try again.",
      });
    }
  }

  const showDistance =
    activityType === "RUN" &&
    (targetType === "DISTANCE_DURATION" || targetType === "DISTANCE_PACE");
  const showDuration =
    activityType === "STRENGTH" ||
    targetType === "DISTANCE_DURATION" ||
    targetType === "DURATION_PACE";
  const showPace =
    activityType === "RUN" &&
    (targetType === "DISTANCE_PACE" || targetType === "DURATION_PACE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Dismiss add activity"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        disabled={isSubmitting}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="add-activity-title"
        aria-modal="true"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {day.day} · {day.date}
            </p>
            <h2
              className="text-xl font-semibold text-zinc-950"
              id="add-activity-title"
            >
              Add activity
            </h2>
          </div>
          <button
            aria-label="Close add activity"
            className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

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
            <input autoFocus className="form-input" {...register("title")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Activity type">
              <select className="form-input" {...register("activityType")}>
                <option value="RUN">Run</option>
                <option value="STRENGTH">Strength</option>
              </select>
            </FormField>
            <FormField label="Time of day">
              <select className="form-input" {...register("timeOfDay")}>
                <option value="ANY">Any time</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </FormField>
          </div>
          {activityType === "RUN" ? (
            <FormField label="Run target">
              <select className="form-input" {...register("targetType")}>
                <option value="DISTANCE_DURATION">Distance + duration</option>
                <option value="DISTANCE_PACE">Distance + pace</option>
                <option value="DURATION_PACE">Duration + pace</option>
              </select>
            </FormField>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {showDistance ? (
              <FormField
                error={errors.distanceKilometres?.message}
                label="Distance (km)"
              >
                <input
                  className="form-input"
                  inputMode="decimal"
                  placeholder="8"
                  {...register("distanceKilometres")}
                />
              </FormField>
            ) : null}
            {showDuration ? (
              <FormField
                error={errors.durationMinutes?.message}
                label={
                  activityType === "STRENGTH"
                    ? "Duration (minutes, optional)"
                    : "Duration (minutes)"
                }
              >
                <input
                  className="form-input"
                  inputMode="numeric"
                  placeholder="45"
                  {...register("durationMinutes")}
                />
              </FormField>
            ) : null}
            {showPace ? (
              <FormField
                error={errors.pacePerKilometre?.message}
                label="Pace (mm:ss / km)"
              >
                <input
                  className="form-input"
                  placeholder="5:30"
                  {...register("pacePerKilometre")}
                />
              </FormField>
            ) : null}
          </div>
          <FormField label="Description (optional)">
            <textarea
              className="form-input min-h-24"
              {...register("description")}
            />
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
              {isSubmitting ? "Adding…" : "Add activity"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
