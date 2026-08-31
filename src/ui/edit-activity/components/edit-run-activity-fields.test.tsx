import { render, renderHook, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import type { EditActivityFormValues } from "../utils/edit-activity-form";
import { EditRunActivityFields } from "./edit-run-activity-fields";

const defaultValues: EditActivityFormValues = {
  title: "Run",
  timeOfDay: "AM",
  description: "",
  distanceKilometres: "5",
  durationMinutes: "30",
  pacePerKilometre: "5:00",
};

test.each([
  ["DISTANCE_DURATION", ["Distance (km)", "Duration (minutes)"]],
  ["DISTANCE_PACE", ["Distance (km)", "Pace (mm:ss / km)"]],
  ["DURATION_PACE", ["Duration (minutes)", "Pace (mm:ss / km)"]],
] as const)("renders the fixed %s target fields", (targetType, labels) => {
  const { result } = renderHook(() =>
    useForm<EditActivityFormValues>({ defaultValues }),
  );
  render(
    <FormProvider {...result.current}>
      <EditRunActivityFields targetType={targetType} />
    </FormProvider>,
  );

  for (const label of labels)
    expect(screen.getByLabelText(label)).toBeDefined();
  expect(screen.getAllByRole("textbox")).toHaveLength(2);
});

test("renders field errors from the form", () => {
  const { result } = renderHook(() =>
    useForm<EditActivityFormValues>({
      defaultValues,
      errors: {
        distanceKilometres: { type: "custom", message: "Bad distance" },
        durationMinutes: { type: "custom", message: "Bad duration" },
        pacePerKilometre: { type: "custom", message: "Bad pace" },
      },
    }),
  );
  const { rerender } = render(
    <FormProvider {...result.current}>
      <EditRunActivityFields targetType="DISTANCE_DURATION" />
    </FormProvider>,
  );
  expect(screen.getByText("Bad distance")).toBeDefined();
  expect(screen.getByText("Bad duration")).toBeDefined();

  rerender(
    <FormProvider {...result.current}>
      <EditRunActivityFields targetType="DURATION_PACE" />
    </FormProvider>,
  );
  expect(screen.getByText("Bad pace")).toBeDefined();
});
