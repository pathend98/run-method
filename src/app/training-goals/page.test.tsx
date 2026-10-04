import { render, screen, within } from "@testing-library/react";

import TrainingGoalsPage from "./page";

test("renders training goals inside the main landmark", () => {
  render(<TrainingGoalsPage />);

  expect(
    within(screen.getByRole("main")).getByRole("heading", {
      level: 1,
      name: "Training goals",
    }),
  ).toBeDefined();
});
