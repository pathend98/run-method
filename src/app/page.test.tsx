import { render, screen } from "@testing-library/react";
import Home from "./page";

test("Home", () => {
  render(<Home />);

  expect(screen.getByRole("main")).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 1, name: "Training planner" }),
  ).toBeDefined();
  expect(
    screen.getByRole("list", { name: "Weekly training planner" }),
  ).toBeDefined();
  expect(screen.getAllByText("Easy run")).toHaveLength(2);
  expect(screen.getByText("Strides")).toBeDefined();
  expect(screen.getByText("Yoga")).toBeDefined();
});
