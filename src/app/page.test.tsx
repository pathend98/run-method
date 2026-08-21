import { render, screen } from "@testing-library/react";
import Home from "./page";

test("Home", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => undefined)),
  );

  render(<Home />);

  expect(screen.getByRole("main")).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 1, name: "Training planner" }),
  ).toBeDefined();
  expect(screen.getByText("Loading training planner...")).toBeDefined();
});
