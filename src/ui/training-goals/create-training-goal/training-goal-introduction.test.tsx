import { fireEvent, render, screen } from "@testing-library/react";
import { TrainingGoalIntroduction } from "./training-goal-introduction";

test("explains training goals and starts the guided form", () => {
  const onStart = vi.fn();
  render(<TrainingGoalIntroduction onStart={onStart} />);
  expect(
    screen.getByText(/A training goal is a period of intentional training/),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Get started" }));
  expect(onStart).toHaveBeenCalledOnce();
});
