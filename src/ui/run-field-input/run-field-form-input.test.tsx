import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import {
  RunFieldFormInput,
  type RunFieldInputValue,
} from "./run-field-form-input";

const defaultValues: RunFieldInputValue = {
  distanceKilometres: "5",
  durationHours: "00",
  durationMinutes: "30",
  durationSeconds: "00",
  pacePerKilometre: "6:00",
  derivedMetric: "pace",
};

const schema = z.object({
  distanceKilometres: z.string().min(1, "Bad distance"),
  durationHours: z.string(),
  durationMinutes: z.string(),
  durationSeconds: z.string(),
  pacePerKilometre: z.string(),
  derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
});

function Harness({
  disabled = false,
  initialValues = defaultValues,
}: {
  disabled?: boolean;
  initialValues?: RunFieldInputValue;
}) {
  const form = useForm<RunFieldInputValue>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
        <RunFieldFormInput disabled={disabled} />
        <output data-testid="dirty-fields">
          {JSON.stringify(form.formState.dirtyFields)}
        </output>
        <button type="submit">Submit</button>
        <button
          onClick={() => {
            form.setError("distanceKilometres", { message: "Bad distance" });
            form.setError("durationMinutes", { message: "Bad duration" });
            form.setError("pacePerKilometre", { message: "Bad pace" });
          }}
          type="button"
        >
          Set errors
        </button>
      </form>
    </FormProvider>
  );
}

test("reads form values and updates derived fields with dirty state", () => {
  render(<Harness />);

  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "5");
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "6:00",
  );

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "10" },
  });

  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "3:00",
  );
  expect(screen.getByTestId("dirty-fields").textContent).toContain(
    '"distanceKilometres":true',
  );
  expect(screen.getByTestId("dirty-fields").textContent).toContain(
    '"pacePerKilometre":true',
  );
});

test("aggregates form errors for the run input", async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Set errors" }));

  expect(await screen.findByText("Bad distance")).toBeDefined();
  expect(screen.getByText("Bad duration")).toBeDefined();
  expect(screen.getByText("Bad pace")).toBeDefined();
});

test("disables every run field", () => {
  render(<Harness disabled />);

  expect(
    screen.getByLabelText<HTMLInputElement>("Distance (km)").disabled,
  ).toBe(true);
  expect(
    screen.getByLabelText<HTMLInputElement>("Duration (hh:mm:ss) hours")
      .disabled,
  ).toBe(true);
  expect(
    screen.getByLabelText<HTMLInputElement>("Pace (mm:ss / km) · Auto")
      .disabled,
  ).toBe(true);
});

test("revalidates run fields when the metric loses focus", async () => {
  render(
    <Harness
      initialValues={{
        ...defaultValues,
        distanceKilometres: "",
        derivedMetric: null,
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByText("Bad distance")).toBeDefined();

  fireEvent.change(screen.getByPlaceholderText("8"), {
    target: { value: "5" },
  });
  expect(screen.getByText("Bad distance")).toBeDefined();
  fireEvent.blur(screen.getByPlaceholderText("8"));

  await waitFor(() => {
    expect(screen.queryByText("Bad distance")).toBeNull();
  });
});
