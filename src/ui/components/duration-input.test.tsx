import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";

import { DurationInput } from "./duration-input";

function TestForm() {
  const { register } = useForm({
    defaultValues: {
      durationHours: "00",
      durationMinutes: "00",
      durationSeconds: "00",
    },
  });

  return (
    <DurationInput
      hoursName="durationHours"
      label="Duration (hh:mm:ss)"
      minutesName="durationMinutes"
      register={register}
      secondsName="durationSeconds"
    />
  );
}

test("renders accessible inline hour, minute, and second inputs", () => {
  render(<TestForm />);

  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes)")).toBeDefined();
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toBeDefined();
});
