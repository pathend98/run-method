import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { FormField } from "@/ui/shared/form-field/form-field";
import { Modal } from "@/ui/shared/modal/modal";
import { RunTrainingSessionFields } from "./components/run-training-session-fields";
import { StrengthTrainingSessionFields } from "./components/strength-training-session-fields";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCreateTrainingSessionMutation } from "@/ui/training-sessions/mutations";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import {
  createAddTrainingSessionFormSchema,
  defaultAddTrainingSessionFormValues,
  toCreateTrainingSessionRequest,
  type AddTrainingSessionFormValues,
} from "./utils/add-training-session-form";

export function AddTrainingSessionModal({ athleteId }: { athleteId: string }) {
  const unit = useDistanceDisplayUnit();
  const [runFieldsPending, setRunFieldsPending] = useState(false);
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const createMutation = useCreateTrainingSessionMutation();
  const form = useForm<AddTrainingSessionFormValues>({
    defaultValues: defaultAddTrainingSessionFormValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(createAddTrainingSessionFormSchema(unit)),
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = form;
  const activityType = useWatch({ control, name: "activityType" });

  const dayDate = activeModal?.kind === "add" ? activeModal.day.date : null;

  if (activeModal?.kind !== "add" || typeof dayDate !== "string") {
    return null;
  }

  const date = dayDate;

  async function submit(values: AddTrainingSessionFormValues) {
    try {
      await createMutation.mutateAsync({
        athleteId,
        request: toCreateTrainingSessionRequest(values, date, unit),
      });
      closeModal();
    } catch {
      setError("root", {
        message: "Unable to add training session. Please try again.",
      });
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss add training session"
      closeLabel="Close add training session"
      eyebrow={format(parseISO(date), "EEEE, d MMMM")}
      footerActions={[
        {
          label: "Cancel",
          onClick: closeModal,
          variant: "tertiary",
        },
        {
          disabled: activityType === "RUN" && runFieldsPending,
          form: "add-training-session-form",
          label: createMutation.isPending ? "Adding…" : "Add training session",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={createMutation.isPending}
      onClose={closeModal}
      size="large"
      title="Add training session"
    >
      <FormProvider {...form}>
        <form
          className="mt-6 space-y-4"
          id="add-training-session-form"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Training session type">
              <select {...register("activityType")}>
                <option value="RUN">Run</option>
                <option value="STRENGTH">Strength</option>
              </select>
            </FormField>
            <FormField label="Time of day">
              <select {...register("timeOfDay")}>
                <option value="AM">Morning</option>
                <option value="ANY">Anytime</option>
                <option value="PM">Evening</option>
              </select>
            </FormField>
          </div>
          {activityType === "RUN" ? (
            <RunTrainingSessionFields onPendingChange={setRunFieldsPending} />
          ) : (
            <StrengthTrainingSessionFields />
          )}
          <FormField label="Description (optional)">
            <textarea className="min-h-24" {...register("description")} />
          </FormField>
        </form>
      </FormProvider>
    </Modal>
  );
}
