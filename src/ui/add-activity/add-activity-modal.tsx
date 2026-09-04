import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { FormField } from "@/ui/components/form-field";
import { Modal } from "@/ui/components/modal";
import { RunActivityFields } from "./components/run-activity-fields";
import { StrengthActivityFields } from "./components/strength-activity-fields";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCreateTrainingSessionMutation } from "@/ui/training-sessions/training-session-mutations";
import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  toCreateTrainingSessionRequest,
  type AddActivityFormValues,
} from "./utils/add-activity-form";

export function AddActivityModal() {
  const [runFieldsPending, setRunFieldsPending] = useState(false);
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const createMutation = useCreateTrainingSessionMutation();
  const form = useForm<AddActivityFormValues>({
    defaultValues: defaultAddActivityFormValues,
    resolver: zodResolver(addActivityFormSchema),
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
  const { day } = activeModal;

  async function submit(values: AddActivityFormValues) {
    try {
      await createMutation.mutateAsync(
        toCreateTrainingSessionRequest(values, date),
      );
      closeModal();
    } catch {
      setError("root", {
        message: "Unable to add activity. Please try again.",
      });
    }
  }

  return (
    <Modal
      dismissLabel="Dismiss add activity"
      closeLabel="Close add activity"
      eyebrow={`${day.day} · ${day.date}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: closeModal,
          variant: "secondary",
        },
        {
          disabled: activityType === "RUN" && runFieldsPending,
          form: "add-activity-form",
          label: createMutation.isPending ? "Adding…" : "Add activity",
          type: "submit",
          variant: "primary",
        },
      ]}
      isBusy={createMutation.isPending}
      onClose={closeModal}
      size="large"
      title="Add activity"
    >
      <FormProvider {...form}>
        <form
          className="mt-6 space-y-4"
          id="add-activity-form"
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
            <FormField label="Activity type">
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
            <RunActivityFields onPendingChange={setRunFieldsPending} />
          ) : (
            <StrengthActivityFields />
          )}
          <FormField label="Description (optional)">
            <textarea className="min-h-24" {...register("description")} />
          </FormField>
        </form>
      </FormProvider>
    </Modal>
  );
}
