import { render, screen } from "@testing-library/react";

import { PlannerStatus } from "./planner-status";

test("PlannerStatus renders status text", () => {
  render(<PlannerStatus message="Loading training planner..." />);

  expect(screen.getByText("Training Plan")).toBeDefined();
  expect(screen.getByText("Loading training planner...")).toBeDefined();
});

test("PlannerStatus renders an optional action", () => {
  render(
    <PlannerStatus
      action={<button type="button">Retry</button>}
      message="Unable to load training planner."
    />,
  );

  expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
});
