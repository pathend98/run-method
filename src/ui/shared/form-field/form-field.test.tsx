import { render, screen } from "@testing-library/react";

import { FormField } from "./form-field";
import styles from "./form-field.module.css";

test("labels its control and renders a validation error", () => {
  render(
    <FormField error="Enter a title" label="Title">
      <input />
    </FormField>,
  );

  const control = screen.getByRole("textbox", { name: /Title/ });
  expect(control).toBeDefined();
  expect(control.closest("label")?.classList).toContain(styles.invalid);
  expect(screen.getByRole("alert").textContent).toBe("Enter a title");
});

test("omits the validation alert when there is no error", () => {
  render(
    <FormField label="Title">
      <input />
    </FormField>,
  );

  expect(screen.queryByRole("alert")).toBeNull();
  expect(
    screen.getByRole("textbox", { name: /Title/ }).closest("label")?.classList,
  ).not.toContain(styles.invalid);
});
