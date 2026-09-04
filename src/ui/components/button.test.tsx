import { render, screen } from "@testing-library/react";

import { Button } from "./button";

test.each([
  ["primary", "bg-teal-700"],
  ["secondary", "border-zinc-200"],
  ["tertiary", "hover:bg-zinc-100"],
  ["destructive", "bg-red-50"],
] as const)("renders the %s variant", (variant, expectedClass) => {
  render(<Button variant={variant}>Action</Button>);

  expect(screen.getByRole("button", { name: "Action" }).classList).toContain(
    expectedClass,
  );
});

test("supports compact and icon sizes", () => {
  render(
    <>
      <Button size="compact">Compact</Button>
      <Button aria-label="Close" size="icon">
        ×
      </Button>
    </>,
  );

  expect(screen.getByRole("button", { name: "Compact" }).classList).toContain(
    "py-1",
  );
  expect(screen.getByRole("button", { name: "Close" }).classList).toContain(
    "size-9",
  );
});

test("forwards native button behavior and disabled state", () => {
  render(
    <Button disabled form="activity-form" type="submit">
      Save
    </Button>,
  );

  const button = screen.getByRole("button", { name: "Save" });
  expect(button).toHaveProperty("disabled", true);
  expect(button).toHaveProperty("type", "submit");
  expect(button.getAttribute("form")).toBe("activity-form");
});
