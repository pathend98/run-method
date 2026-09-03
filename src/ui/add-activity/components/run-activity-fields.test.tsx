import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  type AddActivityFormValues,
} from "../utils/add-activity-form";
import { RunActivityFields } from "./run-activity-fields";

function RunActivityFieldsHarness({ children }: { children: ReactNode }) {
  const form = useForm<AddActivityFormValues>({
    defaultValues: defaultAddActivityFormValues,
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

test("shows fields for every run target", () => {
  render(
    <RunActivityFieldsHarness>
      <RunActivityFields onPendingChange={vi.fn()} />
    </RunActivityFieldsHarness>,
  );

  expect(screen.queryByLabelText("Run target")).toBeNull();
  expect(screen.getByLabelText("Distance (km)")).toBeDefined();
  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toBeDefined();
});

test("renders validation errors for the selected run target", async () => {
  render(
    <RunActivityFieldsHarness>
      <RunActivityFields onPendingChange={vi.fn()} />
    </RunActivityFieldsHarness>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(
    await screen.findByText("Enter a distance in kilometres"),
  ).toBeDefined();
  expect(screen.getByText("Duration must be greater than zero")).toBeDefined();
  expect(screen.getByText("Enter pace as mm:ss")).toBeDefined();
});
