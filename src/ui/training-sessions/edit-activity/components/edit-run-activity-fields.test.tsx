import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { EditActivityFormValues } from "../form/edit-activity-form-schema";
import { EditRunActivityFields } from "./edit-run-activity-fields";

const defaultValues: EditActivityFormValues = {
  title: "Run",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "",
  derivedMetric: "pace",
  distance: "5",
  durationHours: "00",
  durationMinutes: "30",
  durationSeconds: "00",
  pace: "5:00",
};

function Harness({ children }: { children: ReactNode }) {
  const form = useForm<EditActivityFormValues>({ defaultValues });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        {children}
        <output data-testid="dirty-fields">
          {JSON.stringify(form.formState.dirtyFields)}
        </output>
        <output data-testid="submitted">
          {String(form.formState.isSubmitted)}
        </output>
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

test("renders every run metric and identifies the derived metric", () => {
  render(
    <Harness>
      <EditRunActivityFields onPendingChange={vi.fn()} />
    </Harness>,
  );

  expect(screen.getByLabelText("Distance (km)")).toBeDefined();
  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toBeDefined();
});

test("recalculates the derived metric and tracks changed fields", () => {
  render(
    <Harness>
      <EditRunActivityFields onPendingChange={vi.fn()} />
    </Harness>,
  );

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "10" },
  });

  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "3:00",
  );
  expect(screen.getByTestId("dirty-fields").textContent).toContain(
    '"distance":true',
  );
  expect(screen.getByTestId("dirty-fields").textContent).toContain(
    '"pace":true',
  );
});

test("renders field errors from the form after submission", async () => {
  function ErrorHarness() {
    const form = useForm<EditActivityFormValues>({ defaultValues });
    return (
      <FormProvider {...form}>
        <EditRunActivityFields onPendingChange={vi.fn()} />
        <button
          onClick={() => {
            form.setError("distance", { message: "Bad distance" });
            form.setError("durationMinutes", { message: "Bad duration" });
            form.setError("pace", { message: "Bad pace" });
          }}
          type="button"
        >
          Set errors
        </button>
      </FormProvider>
    );
  }
  render(<ErrorHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Set errors" }));

  await waitFor(() => expect(screen.getByText("Bad distance")).toBeDefined());
  expect(screen.getByText("Bad duration")).toBeDefined();
  expect(screen.getByText("Bad pace")).toBeDefined();
});

test("revalidates run metrics after the form has been submitted", async () => {
  render(
    <Harness>
      <EditRunActivityFields onPendingChange={vi.fn()} />
    </Harness>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(screen.getByTestId("submitted").textContent).toBe("true"),
  );

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "9" },
  });

  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "3:20",
  );
});
