import { render, screen } from "@testing-library/react";

import { SummaryProgress } from "./summary-progress";

test("renders an accessible 6px progress bar at 85 percent width", () => {
  render(
    <SummaryProgress
      completedValue={5}
      label="Running distance"
      scheduledValue={10}
    />,
  );

  const progress = screen.getByRole("progressbar", {
    name: "Running distance progress",
  });
  expect(progress.getAttribute("aria-valuenow")).toBe("50");
  expect(progress.classList.contains("h-1.5")).toBe(true);
  expect(progress.classList.contains("w-[85%]")).toBe(true);
  expect(progress.firstElementChild?.classList.contains("bg-teal-600")).toBe(
    true,
  );
});

test("uses zero progress without a scheduled total", () => {
  render(
    <SummaryProgress
      completedValue={5}
      label="Training time"
      scheduledValue={0}
    />,
  );

  expect(
    screen
      .getByRole("progressbar", { name: "Training time progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("0");
});

test("caps progress at 100 percent", () => {
  render(
    <SummaryProgress
      completedValue={15}
      label="Running distance"
      scheduledValue={10}
    />,
  );

  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("100");
});
