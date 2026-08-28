import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  type AddActivityFormValues,
} from "../utils/add-activity-form";
import { StrengthActivityFields } from "./strength-activity-fields";

function StrengthActivityFieldsHarness({ children }: { children: ReactNode }) {
  const form = useForm<AddActivityFormValues>({
    defaultValues: {
      ...defaultAddActivityFormValues,
      activityType: "STRENGTH",
    },
    resolver: zodResolver(addActivityFormSchema),
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
        {children}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

test("renders an optional duration for strength activities", () => {
  render(
    <StrengthActivityFieldsHarness>
      <StrengthActivityFields />
    </StrengthActivityFieldsHarness>,
  );

  expect(screen.getByLabelText("Duration (minutes, optional)")).toBeDefined();
});

test("renders a validation error for an invalid strength duration", async () => {
  render(
    <StrengthActivityFieldsHarness>
      <StrengthActivityFields />
    </StrengthActivityFieldsHarness>,
  );

  fireEvent.change(screen.getByLabelText("Duration (minutes, optional)"), {
    target: { value: "1.5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText("Enter whole minutes")).toBeDefined();
});
