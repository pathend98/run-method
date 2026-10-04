import { act, fireEvent, render, screen } from "@testing-library/react";
import { Navbar } from "./navbar";

const account = vi.hoisted(() => ({
  kind: "REGISTERED" as "REGISTERED" | "GUEST" | null,
  firstName: "Ada" as string | null,
  pathname: "/training-planner",
  error: false,
}));

vi.mock("next/navigation", () => ({ usePathname: () => account.pathname }));
vi.mock("@/ui/users/current-user-query", () => ({
  useCurrentUserQuery: (enabled: boolean) => ({
    isSuccess: enabled && !account.error && account.kind !== null,
    data: { kind: account.kind, firstName: account.firstName },
  }),
}));

beforeEach(() => {
  account.kind = "REGISTERED";
  account.firstName = "Ada";
  account.pathname = "/training-planner";
  account.error = false;
});

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
  expect(trigger().textContent).toContain("Ada");
  expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
  expect(screen.queryByRole("menu")).toBeNull();
});

test("shows You when a registered user has no first name", () => {
  account.firstName = null;
  render(<Navbar />);
  expect(trigger().textContent).toContain("You");
});

test.each(["GUEST", "REGISTERED"] as const)(
  "links to training goals for a %s user",
  (kind) => {
    account.kind = kind;
    render(<Navbar />);

    expect(
      screen.getByRole("link", { name: "Training goals" }).getAttribute("href"),
    ).toBe("/training-goals");
  },
);

test.each(["GUEST", "REGISTERED"] as const)(
  "loads the %s user menu on the training goals route",
  (kind) => {
    account.kind = kind;
    account.pathname = "/training-goals";
    render(<Navbar />);

    expect(trigger().textContent).toContain(kind === "GUEST" ? "Guest" : "Ada");
    fireEvent.click(trigger());
    expect(
      screen.getByRole("menuitem", {
        name: kind === "GUEST" ? "Register" : "Log out",
      }),
    ).toBeDefined();
  },
);

test("updates the label when the current user data changes", () => {
  const view = render(<Navbar />);
  account.firstName = "Grace";
  view.rerender(<Navbar />);
  expect(trigger().textContent).toContain("Grace");
});

test("offers registration to guests without a logout action", () => {
  account.kind = "GUEST";
  render(<Navbar />);
  expect(trigger().textContent).toContain("Guest");
  fireEvent.click(trigger());
  const register = screen.getByRole("menuitem", { name: "Register" });
  expect(register.getAttribute("href")).toBe("/auth");
  expect(screen.queryByRole("menuitem", { name: "Log out" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Settings" })).toBeNull();
  expect(document.activeElement).toBe(register);
  fireEvent.keyDown(register, { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger());
});

test.each(["loading", "error", "welcome page"])(
  "shows icon only for %s",
  (state) => {
    account.kind = state === "loading" ? null : "REGISTERED";
    account.error = state === "error";
    account.pathname = state === "welcome page" ? "/" : "/training-planner";
    render(<Navbar />);
    expect(trigger().textContent).toBe("");
    expect(trigger().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByRole("menuitem", { name: "Settings" })).toBeNull();
    fireEvent.click(trigger());
    expect(screen.queryByRole("menu")).toBeNull();
  },
);

test("loads the user on the settings route", () => {
  account.pathname = "/settings";
  render(<Navbar />);
  fireEvent.click(trigger());
  expect(screen.getByRole("menuitem", { name: "Settings" })).toBeDefined();
});

test("shows settings before logout and focuses settings", () => {
  render(<Navbar />);
  fireEvent.click(trigger());

  const menu = screen.getByRole("menu", { name: "User menu" });
  const settings = screen.getByRole("menuitem", { name: "Settings" });
  const logout = screen.getByRole("menuitem", { name: "Log out" });
  expect(trigger().getAttribute("aria-controls")).toBe(menu.id);
  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
  expect(screen.getAllByRole("menuitem")).toEqual([settings, logout]);
  expect(settings.getAttribute("href")).toBe("/settings");
  expect(logout.tagName).toBe("A");
  expect(logout.getAttribute("href")).toBe("/auth/logout");
  expect(document.activeElement).toBe(settings);

  fireEvent.pointerDown(logout);
  expect(screen.getByRole("menu")).toBeTruthy();
  fireEvent.click(trigger());
  expect(screen.queryByRole("menu")).toBeNull();
});

test.each(["ArrowDown", "ArrowUp"])(
  "opens with %s and moves between items before Escape",
  (key) => {
    render(<Navbar />);
    act(() => trigger().focus());
    fireEvent.keyDown(trigger(), { key });
    const settings = screen.getByRole("menuitem", { name: "Settings" });
    const logout = screen.getByRole("menuitem", { name: "Log out" });
    expect(document.activeElement).toBe(settings);
    act(() => trigger().focus());
    fireEvent.keyDown(trigger(), { key });
    expect(document.activeElement).toBe(settings);
    fireEvent.keyDown(settings, { key });
    expect(document.activeElement).toBe(logout);
    fireEvent.keyDown(logout, { key });
    expect(document.activeElement).toBe(settings);
    fireEvent.keyDown(settings, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  },
);

test("keeps the single guest action focused with arrow keys", () => {
  account.kind = "GUEST";
  render(<Navbar />);
  fireEvent.click(trigger());
  const register = screen.getByRole("menuitem", { name: "Register" });
  fireEvent.keyDown(register, { key: "ArrowDown" });
  expect(document.activeElement).toBe(register);
});

test("closes the menu when settings is selected", () => {
  render(<Navbar />);
  fireEvent.click(trigger());
  const settings = screen.getByRole("menuitem", { name: "Settings" });
  settings.addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(settings);
  expect(screen.queryByRole("menu")).toBeNull();
});

test("leaves native button activation and unrelated keys alone", () => {
  render(<Navbar />);
  for (const key of ["Escape", "Enter", " ", "Tab"]) {
    expect(fireEvent.keyDown(trigger(), { key })).toBe(true);
  }
  // Native Enter/Space activation dispatches click on the button.
  fireEvent.click(trigger());
  expect(screen.getByRole("menu")).toBeTruthy();
  expect(
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Settings" }), {
      key: "Tab",
    }),
  ).toBe(true);
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
  act(() => screen.getByRole("menuitem", { name: "Settings" }).blur());
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
