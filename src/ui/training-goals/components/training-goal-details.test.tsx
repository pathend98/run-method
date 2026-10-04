import { render, screen } from "@testing-library/react";

import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { TrainingGoalDetails } from "./training-goal-details";

test("displays all goal details and preserves description line breaks", () => {
  const goal = createTrainingGoal({
    description: "Run confidently.\nFinish strong.",
    targetDate: "2027-04-12",
    targetDistanceMetres: 21100,
    targetTimeSeconds: 5415,
  });
  render(<TrainingGoalDetails goal={goal} unit="KILOMETRES" />);
  expect(
    screen.getByRole("heading", { level: 2, name: goal.title }),
  ).toBeDefined();
  expect(screen.getByText("Race")).toBeDefined();
  expect(screen.getByText("21.10 km")).toBeDefined();
  expect(screen.getByText("1h 30m 15s")).toBeDefined();
  expect(screen.getByText("12 April 2027").getAttribute("datetime")).toBe(
    "2027-04-12",
  );
  const description = screen.getByText(/Run confidently/);
  expect(description.textContent).toBe(goal.description);
  expect(description.classList.contains("whitespace-pre-wrap")).toBe(true);
});

test("omits absent optional details", () => {
  render(<TrainingGoalDetails goal={createTrainingGoal()} unit="KILOMETRES" />);
  for (const label of [
    "Description",
    "Target date",
    "Target distance",
    "Target finish time",
  ]) {
    expect(screen.queryByText(label)).toBeNull();
  }
});

test.each([
  ["RACE", "Race"],
  ["DISTANCE", "Distance"],
  ["CONSISTENCY", "Consistency"],
  ["OPEN", "Open"],
] as const)("displays a readable label for %s", (type, label) => {
  render(
    <TrainingGoalDetails
      goal={createTrainingGoal({ type })}
      unit="KILOMETRES"
    />,
  );
  expect(screen.getByText(label)).toBeDefined();
});

test("displays distance in miles", () => {
  render(
    <TrainingGoalDetails
      goal={createTrainingGoal({ targetDistanceMetres: 16093 })}
      unit="MILES"
    />,
  );
  expect(screen.getByText("10.00 mi")).toBeDefined();
});

test.each([
  ["2027-01-01", "1 January 2027"],
  ["2028-02-29", "29 February 2028"],
  ["2027-12-31", "31 December 2027"],
])("preserves the target calendar date %s", (targetDate, label) => {
  render(
    <TrainingGoalDetails
      goal={createTrainingGoal({ targetDate })}
      unit="KILOMETRES"
    />,
  );
  expect(screen.getByText(label).getAttribute("datetime")).toBe(targetDate);
});
