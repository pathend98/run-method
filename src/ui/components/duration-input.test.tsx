import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { DurationInput } from "./duration-input";

function Harness() {
  const [value, setValue] = useState({
    hours: "01",
    minutes: "02",
    seconds: "03",
  });

  return (
    <DurationInput
      label="Duration (hh:mm:ss)"
      onChange={setValue}
      value={value}
    />
  );
}

test("renders and updates accessible inline duration inputs", () => {
  render(<Harness />);

  const hours = screen.getByLabelText("Duration (hh:mm:ss) hours");
  const minutes = screen.getByLabelText("Duration (minutes)");
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");
  expect(hours).toHaveProperty("value", "01");
  expect(minutes).toHaveProperty("value", "02");
  expect(seconds).toHaveProperty("value", "03");

  fireEvent.change(hours, { target: { value: "04" } });
  fireEvent.change(minutes, { target: { value: "05" } });
  fireEvent.change(seconds, { target: { value: "06" } });
  expect(hours).toHaveProperty("value", "04");
  expect(minutes).toHaveProperty("value", "05");
  expect(seconds).toHaveProperty("value", "06");
});

test("supports errors, autofocus, disabled state, and group focus events", () => {
  const onBlur = vi.fn();
  const onFocus = vi.fn();
  const { rerender } = render(
    <DurationInput
      autoFocus
      error="Bad duration"
      label="Duration (hh:mm:ss)"
      onBlur={onBlur}
      onChange={vi.fn()}
      onFocus={onFocus}
      value={{ hours: "", minutes: "", seconds: "" }}
    />,
  );

  const hours = screen.getByLabelText<HTMLInputElement>(
    "Duration (hh:mm:ss) hours",
  );
  expect(screen.getByText("Bad duration")).toBeDefined();
  expect(document.activeElement).toBe(hours);

  onFocus.mockClear();
  fireEvent.focus(hours);
  fireEvent.blur(hours);
  expect(onFocus).toHaveBeenCalledOnce();
  expect(onBlur).toHaveBeenCalledOnce();

  rerender(
    <DurationInput
      disabled
      error="Bad duration"
      label="Duration (hh:mm:ss)"
      onBlur={onBlur}
      onChange={vi.fn()}
      onFocus={onFocus}
      value={{ hours: "", minutes: "", seconds: "" }}
    />,
  );
  expect(hours.disabled).toBe(true);
  expect(screen.getByLabelText<HTMLInputElement>("Duration (minutes)").disabled).toBe(
    true,
  );
  expect(
    screen.getByLabelText<HTMLInputElement>(
      "Duration (hh:mm:ss) seconds",
    ).disabled,
  ).toBe(true);

});
