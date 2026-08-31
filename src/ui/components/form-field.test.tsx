import { render, screen } from "@testing-library/react";

import { FormField } from "./form-field";

test("labels its control and renders a validation error", () => {
  render(
    <FormField error="Enter a title" label="Title">
      <input />
    </FormField>,
  );

  expect(screen.getByRole("textbox", { name: /Title/ })).toBeDefined();
  expect(screen.getByRole("alert").textContent).toBe("Enter a title");
});

test("omits the validation alert when there is no error", () => {
  render(
    <FormField label="Title">
      <input />
    </FormField>,
  );

  expect(screen.queryByRole("alert")).toBeNull();
});
