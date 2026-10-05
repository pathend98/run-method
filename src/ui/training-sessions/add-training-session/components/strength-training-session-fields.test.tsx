import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  createAddTrainingSessionFormSchema,
  defaultAddTrainingSessionFormValues,
  type AddTrainingSessionFormValues,
} from "../utils/add-training-session-form";
import { StrengthTrainingSessionFields } from "./strength-training-session-fields";

function StrengthTrainingSessionFieldsHarness({
  children,
}: {
  children: ReactNode;
}) {
  const form = useForm<AddTrainingSessionFormValues>({
    defaultValues: {
      ...defaultAddTrainingSessionFormValues,
      activityType: "STRENGTH",
    },
    resolver: zodResolver(createAddTrainingSessionFormSchema("KILOMETRES")),
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
    <StrengthTrainingSessionFieldsHarness>
      <StrengthTrainingSessionFields />
    </StrengthTrainingSessionFieldsHarness>,
  );

  expect(
    screen.getByLabelText("Duration (hh:mm:ss, optional) hours"),
  ).toBeDefined();
});

test("renders a validation error for an invalid strength duration", async () => {
  render(
    <StrengthTrainingSessionFieldsHarness>
      <StrengthTrainingSessionFields />
    </StrengthTrainingSessionFieldsHarness>,
  );

  fireEvent.change(
    screen.getByLabelText("Duration (hh:mm:ss, optional) seconds"),
    {
      target: { value: "1.5" },
    },
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(await screen.findByText("Enter a whole number")).toBeDefined();
});
