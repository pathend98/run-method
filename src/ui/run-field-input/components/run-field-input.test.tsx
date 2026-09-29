import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import type { RunningMetricInput as RunFieldInputValue } from "@/ui/running-metrics/running-metrics";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";
import { RunFieldInput } from "./run-field-input";

const initialValue: RunFieldInputValue = {
  distance: "",
  durationHours: "00",
  durationMinutes: "00",
  durationSeconds: "00",
  pace: "",
  derivedMetric: null,
};

function Harness({
  onPendingChange,
}: {
  onPendingChange?: (pending: boolean) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <RunFieldInput
      onChange={setValue}
      onPendingChange={onPendingChange}
      value={value}
    />
  );
}

test("shows all metrics and derives pace from the first two valid values", () => {
  const { unmount } = render(<Harness />);

  const metricGrid = screen.getByLabelText("Distance (km)").closest("div.grid");
  expect(metricGrid?.classList).toContain("md:grid-cols-3");
  expect(metricGrid?.classList).not.toContain("sm:grid-cols-3");
  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toHaveProperty(
    "value",
    "",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) hours")).toHaveProperty(
    "placeholder",
    "hh",
  );
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "",
  );
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "placeholder",
    "mm",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toHaveProperty(
    "value",
    "",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toHaveProperty(
    "placeholder",
    "ss",
  );

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });

  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "5:38",
  );
  unmount();
});

test("derives duration from distance and pace", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / km)"), {
    target: { value: "5:30" },
  });

  expect(screen.getByText("Duration (hh:mm:ss) · Auto")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "44",
  );
});

test("uses mile labels and recalculates when the automatic metric changes", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <Harness />
    </DistanceDisplayProvider>,
  );
  fireEvent.change(screen.getByLabelText("Distance (mi)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "40" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / mi) · Auto");
  expect(pace).toHaveProperty("value", "8:00");

  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "7:30" } });
  fireEvent.blur(pace);
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "37",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toHaveProperty(
    "value",
    "30",
  );
});

test("derives distance from duration and pace", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / km)"), {
    target: { value: "5:00" },
  });

  expect(screen.getByLabelText("Distance (km) · Auto")).toHaveProperty(
    "value",
    "9",
  );
});

test("recalculates Auto when an authoritative metric changes", () => {
  render(<Harness />);
  const distance = screen.getByLabelText("Distance (km)");
  fireEvent.change(distance, { target: { value: "8" } });
  fireEvent.focus(distance);
  fireEvent.blur(distance);
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  fireEvent.change(distance, { target: { value: "10" } });

  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "4:24",
  );
});

test("supports hours and seconds while collecting the first duration", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Duration (hh:mm:ss) hours"), {
    target: { value: "01" },
  });
  fireEvent.change(screen.getByLabelText("Duration (hh:mm:ss) seconds"), {
    target: { value: "30" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "10" },
  });
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "6:03",
  );
});

test("asks which authority to keep after a valid Auto edit on blur", () => {
  const onPendingChange = vi.fn();
  render(<Harness onPendingChange={onPendingChange} />);
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "5:20" } });
  expect(screen.queryByText("Which value should remain fixed?")).toBeNull();
  fireEvent.blur(pace);

  expect(screen.getByText("Which value should remain fixed?")).toBeDefined();
  expect(onPendingChange).toHaveBeenLastCalledWith(true);
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.queryByText("Which value should remain fixed?")).toBeNull();
  expect(screen.getByText("Duration (hh:mm:ss) · Auto")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "42",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toHaveProperty(
    "value",
    "40",
  );
  expect(onPendingChange).toHaveBeenLastCalledWith(false);
});

test("treats the duration controls as one field and can move Auto to pace", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / km)"), {
    target: { value: "5:30" },
  });
  const minutes = screen.getByLabelText("Duration (minutes)");
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");
  fireEvent.focus(minutes);
  fireEvent.change(minutes, { target: { value: "45" } });
  fireEvent.blur(minutes, { relatedTarget: seconds });
  expect(screen.queryByText("Which value should remain fixed?")).toBeNull();
  fireEvent.blur(seconds);
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "5:38",
  );
});

test("accepts an Auto distance override and can keep duration", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / km)"), {
    target: { value: "5:00" },
  });
  const distance = screen.getByLabelText("Distance (km) · Auto");
  fireEvent.focus(distance);
  fireEvent.change(distance, { target: { value: "10" } });
  fireEvent.blur(distance);
  fireEvent.click(screen.getByRole("button", { name: "Keep duration" }));
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "4:30",
  );
});

test("does not prompt for an unchanged Auto value and cancels a prompt on an authority edit", () => {
  render(<Harness />);
  const distance = screen.getByLabelText("Distance (km)");
  fireEvent.change(distance, { target: { value: "8" } });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.blur(pace);
  expect(screen.queryByText("Which value should remain fixed?")).toBeNull();

  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "5:20" } });
  fireEvent.blur(pace);
  expect(screen.getByText("Which value should remain fixed?")).toBeDefined();
  fireEvent.change(distance, { target: { value: "10" } });
  expect(screen.queryByText("Which value should remain fixed?")).toBeNull();
});

test("compares every duration part when an Auto duration is edited", () => {
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / km)"), {
    target: { value: "5:30" },
  });
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");
  fireEvent.focus(seconds);
  fireEvent.change(seconds, { target: { value: "01" } });
  fireEvent.blur(seconds);
  expect(screen.getByText("Which value should remain fixed?")).toBeDefined();
});

test("keeps an invalid Auto edit and clears Auto while an authority is invalid", () => {
  render(<Harness />);
  const distance = screen.getByLabelText("Distance (km)");
  fireEvent.change(distance, { target: { value: "8" } });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "bad" } });
  fireEvent.blur(pace);
  expect(pace).toHaveProperty("value", "bad");

  fireEvent.change(distance, { target: { value: "" } });
  expect(pace).toHaveProperty("value", "");
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  expect(pace).toHaveProperty("value", "");
  fireEvent.change(distance, { target: { value: "10" } });
  expect(pace).toHaveProperty("value", "4:30");
});
