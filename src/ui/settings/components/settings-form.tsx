import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { User } from "@/domain/user-types";
import { Button } from "@/ui/components/button";
import { FormField } from "@/ui/components/form-field";
import { updateCurrentUser } from "@/ui/users/user-api-client";

type SettingsFormValues = {
  firstName: string;
  measurementUnit: User["measurementUnit"];
};

type SettingsFormProps = {
  user: User;
};

export function SettingsForm({ user }: SettingsFormProps) {
  const queryClient = useQueryClient();
  const [savedUser, setSavedUser] = useState(user);
  const [saved, setSaved] = useState(false);
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      firstName: user.firstName ?? "",
      measurementUnit: user.measurementUnit,
    },
  });
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = form;
  const firstName = useWatch({ control, name: "firstName" });
  const measurementUnit = useWatch({ control, name: "measurementUnit" });
  const hasChanges =
    firstName.trim() !== (savedUser.firstName ?? "") ||
    measurementUnit !== savedUser.measurementUnit;

  async function submit(values: SettingsFormValues) {
    if (!hasChanges) return;

    clearErrors("root");
    setSaved(false);
    try {
      const updated = await updateCurrentUser({
        firstName: values.firstName.trim() || null,
        measurementUnit: values.measurementUnit,
      });
      queryClient.setQueryData(["current-user"], updated);
      setSavedUser(updated);
      reset({
        firstName: updated.firstName ?? "",
        measurementUnit: updated.measurementUnit,
      });
      setSaved(true);
    } catch {
      setError("root", {
        message: "Unable to save settings. Please try again.",
      });
    }
  }

  function edited() {
    setSaved(false);
    clearErrors("root");
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(submit)}>
      <FormField label="First name">
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 focus-visible:outline-2 focus-visible:outline-teal-600"
          disabled={isSubmitting}
          maxLength={100}
          type="text"
          {...register("firstName", { onChange: edited })}
        />
      </FormField>
      <FormField label="Measurement unit">
        <select
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 focus-visible:outline-2 focus-visible:outline-teal-600"
          disabled={isSubmitting}
          {...register("measurementUnit", { onChange: edited })}
        >
          <option value="KILOMETRES">Kilometres</option>
          <option value="MILES">Miles</option>
        </select>
      </FormField>
      <p className="text-sm text-zinc-600">
        Distance and pace displays and entry fields use your selected unit.
      </p>
      <div className="flex items-center gap-3">
        <Button
          disabled={!hasChanges || isSubmitting}
          type="submit"
          variant="primary"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        {saved ? <span role="status">Settings saved.</span> : null}
      </div>
      {errors.root ? (
        <p className="text-sm text-red-700" role="alert">
          {errors.root.message}
        </p>
      ) : null}
    </form>
  );
}
