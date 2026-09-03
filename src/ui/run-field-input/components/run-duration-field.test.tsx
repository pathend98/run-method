import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import type { RunFieldInputValue } from "../utils/run-field-calculations";
import { RunDurationField } from "./run-duration-field";

const zeroValue: RunFieldInputValue = {
  distanceKilometres: "",
  durationHours: "00",
  durationMinutes: "00",
  durationSeconds: "00",
  pacePerKilometre: "",
  derivedMetric: null,
};

function Harness() {
  const [value, setValue] = useState(zeroValue);
  return (
    <RunDurationField
      auto={false}
      disabled={false}
      onAutoEditEnd={vi.fn()}
      onAutoEditStart={vi.fn()}
      onChange={setValue}
      value={value}
    />
  );
}

test("shows an untouched zero duration as empty and updates every part", () => {
  render(<Harness />);
  const hours = screen.getByLabelText("Duration (hh:mm:ss) hours");
  const minutes = screen.getByLabelText("Duration (minutes)");
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");

  expect(hours).toHaveProperty("value", "");
  expect(minutes).toHaveProperty("value", "");
  expect(seconds).toHaveProperty("value", "");

  fireEvent.change(hours, { target: { value: "01" } });
  fireEvent.change(minutes, { target: { value: "02" } });
  fireEvent.change(seconds, { target: { value: "03" } });
  expect(hours).toHaveProperty("value", "01");
  expect(minutes).toHaveProperty("value", "02");
  expect(seconds).toHaveProperty("value", "03");
});

test("treats focus movement between duration inputs as one edit", () => {
  const onAutoEditStart = vi.fn();
  const onAutoEditEnd = vi.fn();
  render(
    <RunDurationField
      auto
      disabled={false}
      onAutoEditEnd={onAutoEditEnd}
      onAutoEditStart={onAutoEditStart}
      onChange={vi.fn()}
      value={{ ...zeroValue, durationMinutes: "30" }}
    />,
  );
  const minutes = screen.getByLabelText("Duration (minutes)");
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");

  fireEvent.focus(minutes);
  expect(onAutoEditStart).toHaveBeenCalledOnce();
  fireEvent.blur(minutes, { relatedTarget: seconds });
  expect(onAutoEditEnd).not.toHaveBeenCalled();
  fireEvent.blur(seconds);
  expect(onAutoEditEnd).toHaveBeenCalledOnce();
});

test("renders its Auto label and error and disables all controls", () => {
  render(
    <RunDurationField
      auto
      disabled
      error="Bad duration"
      onAutoEditEnd={vi.fn()}
      onAutoEditStart={vi.fn()}
      onChange={vi.fn()}
      value={{ ...zeroValue, durationMinutes: "30" }}
    />,
  );

  expect(screen.getByText("Duration (hh:mm:ss) · Auto")).toBeDefined();
  expect(screen.getByText("Bad duration")).toBeDefined();
  expect(
    screen.getByLabelText<HTMLInputElement>(
      "Duration (hh:mm:ss) hours",
    ).disabled,
  ).toBe(true);
  expect(
    screen.getByLabelText<HTMLInputElement>("Duration (minutes)").disabled,
  ).toBe(true);
  expect(
    screen.getByLabelText<HTMLInputElement>(
      "Duration (hh:mm:ss) seconds",
    ).disabled,
  ).toBe(true);
});
