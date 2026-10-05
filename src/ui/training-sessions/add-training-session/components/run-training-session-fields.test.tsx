import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  createAddTrainingSessionFormSchema,
  defaultAddTrainingSessionFormValues,
  type AddTrainingSessionFormValues,
} from "../utils/add-training-session-form";
import { RunTrainingSessionFields } from "./run-training-session-fields";

function RunTrainingSessionFieldsHarness({
  children,
}: {
  children: ReactNode;
}) {
  const form = useForm<AddTrainingSessionFormValues>({
    defaultValues: defaultAddTrainingSessionFormValues,
    resolver: zodResolver(createAddTrainingSessionFormSchema("KILOMETRES")),
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
        {children}
        <output data-testid="dirty-fields">
          {JSON.stringify(form.formState.dirtyFields)}
        </output>
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

test("shows fields for every run target", () => {
  render(
    <RunTrainingSessionFieldsHarness>
      <RunTrainingSessionFields onPendingChange={vi.fn()} />
    </RunTrainingSessionFieldsHarness>,
  );

  expect(screen.queryByLabelText("Run target")).toBeNull();
  expect(screen.getByLabelText("Distance (km)")).toBeDefined();
  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toBeDefined();
});

test("renders validation errors for the selected run target", async () => {
  render(
    <RunTrainingSessionFieldsHarness>
      <RunTrainingSessionFields onPendingChange={vi.fn()} />
    </RunTrainingSessionFieldsHarness>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  expect(
    await screen.findByText("Enter a distance in kilometres"),
  ).toBeDefined();
  expect(screen.getByText("Duration must be greater than zero")).toBeDefined();
  expect(screen.getByText("Enter pace as mm:ss")).toBeDefined();
});

test("does not validate untouched metrics when distance is entered", () => {
  render(
    <RunTrainingSessionFieldsHarness>
      <RunTrainingSessionFields onPendingChange={vi.fn()} />
    </RunTrainingSessionFieldsHarness>,
  );

  fireEvent.change(screen.getByPlaceholderText("8"), {
    target: { value: "8" },
  });

  expect(screen.queryByText("Duration must be greater than zero")).toBeNull();
  expect(screen.queryByText("Enter pace as mm:ss")).toBeNull();
  expect(screen.getByTestId("dirty-fields").textContent).toBe(
    JSON.stringify({ distance: true }),
  );
});

test("keeps an invalid Auto metric so it can be validated after blur", async () => {
  render(
    <RunTrainingSessionFieldsHarness>
      <RunTrainingSessionFields onPendingChange={vi.fn()} />
    </RunTrainingSessionFieldsHarness>,
  );

  fireEvent.change(screen.getByPlaceholderText("8"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "bad" } });
  fireEvent.blur(pace);

  expect(await screen.findByText("Enter pace as mm:ss")).toBeDefined();
  expect(pace).toHaveProperty("value", "bad");
});

test("revalidates run metrics when they lose focus", async () => {
  render(
    <RunTrainingSessionFieldsHarness>
      <RunTrainingSessionFields onPendingChange={vi.fn()} />
    </RunTrainingSessionFieldsHarness>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(
    await screen.findByText("Duration must be greater than zero"),
  ).toBeDefined();

  fireEvent.change(screen.getByPlaceholderText("8"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.blur(screen.getByPlaceholderText("8"));
  fireEvent.blur(screen.getByLabelText("Duration (minutes)"));
  fireEvent.blur(screen.getByPlaceholderText("5:30"));

  await waitFor(() => {
    expect(screen.queryByText("Duration must be greater than zero")).toBeNull();
    expect(screen.queryByText("Enter pace as mm:ss")).toBeNull();
  });
});
