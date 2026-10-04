import { render, screen } from "@testing-library/react";

import { TrainingGoals } from "./training-goals";

test("renders the training goals heading", () => {
  render(<TrainingGoals />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Training goals" }),
  ).toBeDefined();
});
