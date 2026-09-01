import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import {
  createEditActivityFormSchema,
  type EditActivityFormValues,
} from "../utils/edit-activity-form-schema";
import { getEditActivityFormValues } from "../utils/edit-activity-form-values";
import { toEditTrainingSessionRequest } from "../utils/edit-training-session-request";
import { EditRunActivityFields } from "./edit-run-activity-fields";

type EditActivityFormProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  onClose: () => void;
  onEdit: (request: EditTrainingSessionRequest) => Promise<unknown>;
};

export function EditActivityForm({
  activity,
  isSubmitting,
  onClose,
  onEdit,
}: EditActivityFormProps) {
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
        {isScheduled && activity.activityType === "STRENGTH" ? (
          <FormField
            error={errors.durationMinutes?.message}
            label="Duration (minutes, optional)"
          >
            <input inputMode="numeric" {...register("durationMinutes")} />
          </FormField>
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
  );
}
