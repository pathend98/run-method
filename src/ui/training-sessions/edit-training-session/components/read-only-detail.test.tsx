import { render, screen } from "@testing-library/react";

import { ReadOnlyDetail } from "./read-only-detail";

test("renders the label and value as definition list content", () => {
  render(
    <dl>
      <ReadOnlyDetail label="Training session type" value="Run" />
    </dl>,
  );

  expect(screen.getByText("Training session type").tagName).toBe("DT");
  expect(screen.getByText("Run").tagName).toBe("DD");
});
