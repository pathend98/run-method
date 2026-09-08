import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { getWeekDateOptions } from "@/core/date/week-date-options";
import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { DurationFormInput } from "@/ui/components/duration-form-input";
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
  onClose: () => void;
  onEdit: (request: EditTrainingSessionRequest) => Promise<unknown>;
  onRunFieldsPendingChange?: (pending: boolean) => void;
};

function doNothing() {}

export function EditActivityForm({
  activity,
  onClose,
  onEdit,
  onRunFieldsPendingChange = doNothing,
}: EditActivityFormProps) {
  const form = useForm<EditActivityFormValues>({
    defaultValues: getEditActivityFormValues(activity),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(createEditActivityFormSchema(activity)),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;
  const isScheduled = activity.status === "SCHEDULED";
  const isCompleted = activity.status === "COMPLETED";

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
        id="edit-activity-form"
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
          <>
            <FormField label="Day">
              <select {...register("date")}>
                {getWeekDateOptions(activity.date).map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Time of day">
              <select {...register("timeOfDay")}>
                <option value="AM">Morning</option>
                <option value="ANY">Anytime</option>
                <option value="PM">Evening</option>
              </select>
            </FormField>
          </>
        ) : null}
        {isCompleted ? (
          <h3 className="text-sm font-semibold text-zinc-950">
            Actual metrics
          </h3>
        ) : null}
        {(isScheduled || isCompleted) && activity.activityType === "RUN" ? (
          <EditRunActivityFields onPendingChange={onRunFieldsPendingChange} />
        ) : null}
        {(isScheduled || isCompleted) && activity.activityType === "STRENGTH" ? (
          <DurationFormInput
            label={
              isCompleted
                ? "Actual duration (hh:mm:ss)"
                : "Duration (hh:mm:ss, optional)"
            }
          />
        ) : null}
        <FormField label="Description (optional)">
          <textarea className="min-h-24" {...register("description")} />
        </FormField>
      </form>
    </FormProvider>
  );
}
