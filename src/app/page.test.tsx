import { render, screen, within } from "@testing-library/react";

import HomePage from "./page";

test("renders the login choice in the home page", () => {
  render(<HomePage />);

  const main = within(screen.getByRole("main"));
  expect(
    main.getByRole("button", { name: "Continue to login / signup" }),
  ).toBeDefined();
  expect(main.getByRole("button", { name: "Continue as guest" })).toBeDefined();
});
