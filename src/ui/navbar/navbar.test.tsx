import { act, fireEvent, render, screen } from "@testing-library/react";
import { Navbar } from "./navbar";

function trigger() {
  return screen.getByRole("button", { name: "User menu" });
}

test("renders accessible navigation with the menu initially closed", () => {
  render(<Navbar />);

  expect(
    screen.getByRole("navigation", { name: "Main navigation" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Training planner" }).getAttribute("href"),
  ).toBe("/training-planner");
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("toggles a labelled menu and focuses the existing logout endpoint", () => {
  render(<Navbar />);
  fireEvent.click(trigger());

  const menu = screen.getByRole("menu", { name: "User menu" });
  const logout = screen.getByRole("menuitem", { name: "Log out" });
  expect(trigger().getAttribute("aria-controls")).toBe(menu.id);
  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
  expect(logout.tagName).toBe("A");
  expect(logout.getAttribute("href")).toBe("/auth/logout");
  expect(document.activeElement).toBe(logout);

  fireEvent.pointerDown(logout);
  expect(screen.getByRole("menu")).toBeTruthy();
  fireEvent.click(trigger());
  expect(screen.queryByRole("menu")).toBeNull();
});

test.each(["ArrowDown", "ArrowUp"])(
  "opens with %s and closes with Escape",
  (key) => {
    render(<Navbar />);
    act(() => trigger().focus());
    fireEvent.keyDown(trigger(), { key });
    const logout = screen.getByRole("menuitem");
    expect(document.activeElement).toBe(logout);
    act(() => trigger().focus());
    fireEvent.keyDown(trigger(), { key });
    expect(document.activeElement).toBe(logout);
    fireEvent.keyDown(logout, { key });
    expect(document.activeElement).toBe(logout);
    fireEvent.keyDown(logout, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  },
);

test("leaves native button activation and unrelated keys alone", () => {
  render(<Navbar />);
  for (const key of ["Escape", "Enter", " ", "Tab"]) {
    expect(fireEvent.keyDown(trigger(), { key })).toBe(true);
  }
  // Native Enter/Space activation dispatches click on the button.
  fireEvent.click(trigger());
  expect(screen.getByRole("menu")).toBeTruthy();
  expect(fireEvent.keyDown(screen.getByRole("menuitem"), { key: "Tab" })).toBe(
    true,
  );
});

test("dismisses on an outside pointer interaction", () => {
  render(<Navbar />);
  fireEvent.click(trigger());
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("menu")).toBeNull();
});

test("keeps the menu open for internal focus and closes when focus leaves", () => {
  render(<Navbar />);
  fireEvent.click(trigger());
  act(() => trigger().focus());
  expect(screen.getByRole("menu")).toBeTruthy();
  act(() => screen.getByRole("link", { name: "Training planner" }).focus());
  expect(screen.queryByRole("menu")).toBeNull();

  fireEvent.click(trigger());
  act(() => screen.getByRole("menuitem").blur());
  expect(screen.queryByRole("menu")).toBeNull();
});

test("removes outside interaction listeners on unmount", () => {
  const removeListener = vi.spyOn(document, "removeEventListener");
  const { unmount } = render(<Navbar />);
  fireEvent.click(trigger());
  unmount();
  expect(removeListener).toHaveBeenCalledWith(
    "pointerdown",
    expect.any(Function),
  );
  removeListener.mockRestore();
});
