import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { CreateTrainingSessionRequest } from "@/domain/training-sessions";
import { FormField } from "@/ui/components/form-field";
import { Modal } from "@/ui/components/modal";
import { RunActivityFields } from "./components/run-activity-fields";
import { StrengthActivityFields } from "./components/strength-activity-fields";
import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  toCreateTrainingSessionRequest,
  type AddActivityFormValues,
} from "./utils/add-activity-form";

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

  return (
    <Modal
      dismissLabel="Dismiss add activity"
      eyebrow={`${day.day} · ${day.date}`}
      footerActions={[
        {
          label: "Cancel",
          onClick: onClose,
          variant: "secondary",
        },
        {
          form: "add-activity-form",
          label: isSubmitting ? "Adding…" : "Add activity",
          type: "submit",
          variant: "primary",
        },
      ]}
      headerActions={[
        {
          ariaLabel: "Close add activity",
          label: "Close",
          onClick: onClose,
          variant: "secondary",
        },
      ]}
      isBusy={isSubmitting}
      onClose={onClose}
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
                <option value="ANY">Any time</option>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </FormField>
          </div>
          {activityType === "RUN" ? (
            <RunActivityFields />
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
