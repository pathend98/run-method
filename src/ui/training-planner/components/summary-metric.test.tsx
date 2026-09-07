import { render, screen } from "@testing-library/react";

import { SummaryMetric } from "./summary-metric";

test("hides completed values for future weeks", () => {
  render(
    <SummaryMetric
      completed="5.0 km"
      isFutureWeek
      label="Running distance"
      scheduled="10.0 km"
    />,
  );

  expect(screen.queryByText("5.0 km completed")).toBeNull();
  expect(screen.getByText("10.0 km scheduled")).toBeDefined();
});
