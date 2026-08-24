import { formatActivityType } from "./training-planner-formatters";

test("formatActivityType formats run activities", () => {
  expect(formatActivityType("RUN")).toBe("Run");
});

test("formatActivityType formats strength activities", () => {
  expect(formatActivityType("STRENGTH")).toBe("Strength");
});
