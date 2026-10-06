import { formatWeekRange, formatDayDate } from "./calendar-date-formatters";

test.each([
  [{ from: "2026-08-17", to: "2026-08-23" }, "17 Aug – 23 Aug"],
  [{ from: "2026-08-31", to: "2026-09-06" }, "31 Aug – 6 Sep"],
  [{ from: "2025-12-29", to: "2026-01-04" }, "29 Dec – 4 Jan"],
])("formatWeekRange formats %#", (range, expected) => {
  expect(formatWeekRange(range)).toBe(expected);
});

test("formatDayDate formats a compact day label", () => {
  expect(formatDayDate("2026-08-17")).toBe("17 Aug");
});
