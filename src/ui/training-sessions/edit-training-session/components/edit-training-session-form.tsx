import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { getWeekDateOptions } from "@/core/date/week-date-options";
import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import { DurationFormInput } from "@/ui/shared/duration-form-input";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import { FormField } from "@/ui/shared/form-field/form-field";
import {
  createEditTrainingSessionFormSchema,
  type EditTrainingSessionFormValues,
} from "../utils/edit-training-session-form-schema";
import { getEditTrainingSessionFormValues } from "../utils/edit-training-session-form-values";
import { toEditTrainingSessionRequest } from "../utils/edit-training-session-request";
import { EditRunTrainingSessionFields } from "./edit-run-training-session-fields";

type EditTrainingSessionFormProps = {
  trainingSession: TrainingSession;
  onClose: () => void;
  onEdit: (request: EditTrainingSessionRequest) => Promise<unknown>;
  onRunFieldsPendingChange?: (pending: boolean) => void;
};

function doNothing() {}

export function EditTrainingSessionForm({
  trainingSession,
  onClose,
  onEdit,
  onRunFieldsPendingChange = doNothing,
}: EditTrainingSessionFormProps) {
  const unit = useDistanceDisplayUnit();
  const form = useForm<EditTrainingSessionFormValues>({
    defaultValues: getEditTrainingSessionFormValues(trainingSession, unit),
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(
      createEditTrainingSessionFormSchema(trainingSession, unit),
    ),
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;
  const isScheduled = trainingSession.status === "SCHEDULED";
  const isCompleted = trainingSession.status === "COMPLETED";

  async function submit(values: EditTrainingSessionFormValues) {
    try {
      await onEdit(toEditTrainingSessionRequest(values, trainingSession, unit));
      onClose();
    } catch {
      setError("root", {
        message: "Unable to edit training session. Please try again.",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form
        className="mt-6 space-y-4"
        id="edit-training-session-form"
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
                {getWeekDateOptions(trainingSession.date).map((day) => (
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
        {(isScheduled || isCompleted) &&
        trainingSession.activityType === "RUN" ? (
          <EditRunTrainingSessionFields
            onPendingChange={onRunFieldsPendingChange}
          />
        ) : null}
        {(isScheduled || isCompleted) &&
        trainingSession.activityType === "STRENGTH" ? (
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
