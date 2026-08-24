import { render, screen } from "@testing-library/react";
import { DetailTerm } from "./detail-term";

test("renders a description term and detail value", () => {
  render(
    <dl>
      <DetailTerm label="Target distance" value="6.0 km" />
    </dl>,
  );

  expect(screen.getByText("Target distance").tagName).toBe("DT");
  expect(screen.getByText("6.0 km").tagName).toBe("DD");
});
