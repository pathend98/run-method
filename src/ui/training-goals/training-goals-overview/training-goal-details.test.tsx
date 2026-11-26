import { render, screen } from "@testing-library/react";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { TrainingGoalDetails } from "./training-goal-details";

test("renders complete and discard goal buttons", () => {
  render(<TrainingGoalDetails goal={createTrainingGoal()} />);
  for (const name of ["Complete goal", "Discard goal"]) {
    expect(screen.getByRole("button", { name }).getAttribute("type")).toBe(
      "button",
    );
  }
});

test("displays all goal details and preserves multiline text", () => {
  const goal = createTrainingGoal({
    purpose: "Build fitness.\nFeel stronger.",
    trainingIntentions: "Run consistently.\nRecover well.",
  });
  render(<TrainingGoalDetails goal={goal} />);
  expect(
    screen.getByRole("heading", { level: 2, name: goal.title }),
  ).toBeDefined();
  for (const [pattern, value] of [
    [/Build fitness/, goal.purpose],
    [/Run consistently/, goal.trainingIntentions],
  ] as const) {
    const element = screen.getByText(pattern);
    expect(element.textContent).toBe(value);
    expect(element.classList.contains("whitespace-pre-wrap")).toBe(true);
  }
  expect(screen.getByText("2 October 2026").getAttribute("datetime")).toBe(
    goal.startDate,
  );
  expect(screen.getByText("1 December 2026").getAttribute("datetime")).toBe(
    goal.targetDate,
  );
  for (const label of [
    "Goal type",
    "Description",
    "Target distance",
    "Target finish time",
  ]) {
    expect(screen.queryByText(label)).toBeNull();
  }
});

test.each([
  ["2027-01-01", "1 January 2027"],
  ["2028-02-29", "29 February 2028"],
  ["2027-12-31", "31 December 2027"],
])("preserves calendar dates %s", (date, label) => {
  render(
    <TrainingGoalDetails
      goal={createTrainingGoal({ startDate: date, targetDate: date })}
    />,
  );
  expect(screen.getAllByText(label)).toHaveLength(2);
  for (const element of screen.getAllByText(label)) {
    expect(element.getAttribute("datetime")).toBe(date);
  }
});
