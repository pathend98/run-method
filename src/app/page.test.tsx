import { render, screen } from "@testing-library/react";
import Home from "./page";

// This is more of a placeholder test until the application is more fleshed out.
test("Home", () => {
  render(<Home />);
  expect(screen.getByRole("main")).toBeDefined();
});
