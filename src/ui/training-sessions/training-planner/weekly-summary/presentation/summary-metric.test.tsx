import { render, screen } from "@testing-library/react";

import { SummaryMetric } from "./summary-metric";

test("renders scheduled values as the primary figure for future weeks", () => {
  render(
    <SummaryMetric
      completed="5.0 km"
      completedValue={5000}
      isFutureWeek
      isPastWeek={false}
      label="Running distance"
      scheduled="10.0 km"
      scheduledValue={10000}
      variance={null}
    />,
  );

  expect(screen.queryByText("5.0 km")).toBeNull();
  const scheduled = screen.getByText("10.0 km scheduled");
  expect(scheduled.classList.contains("text-2xl")).toBe(true);
  expect(scheduled.classList.contains("font-semibold")).toBe(true);
  expect(scheduled.classList.contains("text-zinc-950")).toBe(true);
});

test("renders completed values as the primary figure and scheduled values as secondary", () => {
  render(
    <SummaryMetric
      completed="5.0 km"
      completedValue={5000}
      isFutureWeek={false}
      isPastWeek={false}
      label="Running distance"
      scheduled="10.0 km"
      scheduledValue={10000}
      variance={null}
    />,
  );

  const completed = screen.getByText("5.0 km");
  const scheduled = screen.getByText("10.0 km scheduled");
  expect(completed.classList.contains("text-2xl")).toBe(true);
  expect(completed.classList.contains("font-semibold")).toBe(true);
  expect(completed.classList.contains("text-zinc-950")).toBe(true);
  expect(scheduled.classList.contains("text-sm")).toBe(true);
  expect(scheduled.classList.contains("text-zinc-600")).toBe(true);
});
