import { render, screen } from "@testing-library/react";

import { FormField } from "./form-field";

test("labels its control and renders an optional error", () => {
  const { rerender } = render(
    <FormField error="Required" label="Title">
      <input />
    </FormField>,
  );
  expect(screen.getByRole("textbox")).toBeDefined();
  expect(screen.getByRole("alert").textContent).toBe("Required");

  rerender(
    <FormField label="Title">
      <input />
    </FormField>,
  );
  expect(screen.queryByRole("alert")).toBeNull();
});
