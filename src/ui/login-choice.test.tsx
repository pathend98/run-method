import { fireEvent, render, screen } from "@testing-library/react";

import { LoginChoice } from "./login-choice";

test("starts login through a native GET form targeting auth", () => {
  render(<LoginChoice />);

  const login = screen.getByRole("button", {
    name: "Continue to login / signup",
  });
  expect(login).toHaveProperty("type", "submit");
  const form = login.closest("form")!;
  expect(form.getAttribute("action")).toBe("/auth");
  expect(form.getAttribute("method")).toBe("get");
  const submit = vi.fn((event: Event) => event.preventDefault());
  form.addEventListener("submit", submit);

  fireEvent.click(login);

  expect(submit).toHaveBeenCalledOnce();
});

test("starts guest creation through a native GET form targeting auth/guest", () => {
  render(<LoginChoice />);
  const guest = screen.getByRole("button", { name: "Continue as guest" });
  const submit = vi.fn((event: Event) => event.preventDefault());
  guest.closest("form")!.addEventListener("submit", submit);

  expect(guest).toHaveProperty("type", "submit");
  expect(guest.getAttribute("formaction")).toBe("/auth/guest");
  expect(guest.getAttribute("formmethod")).toBe("get");
  fireEvent.click(guest);

  expect(submit).toHaveBeenCalledOnce();
});
