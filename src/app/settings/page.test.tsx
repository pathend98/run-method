import { render, screen } from "@testing-library/react";

import SettingsPage from "./page";

vi.mock("@/ui/users/user-settings", () => ({
  Settings: () => <h1>Settings content</h1>,
}));

test("renders settings inside the main landmark", () => {
  render(<SettingsPage />);
  expect(screen.getByRole("main").textContent).toContain("Settings content");
});
