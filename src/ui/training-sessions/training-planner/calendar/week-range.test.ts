import {
  getCurrentWeekRange,
  resolveWeekRange,
  getAdjacentWeekStart,
} from "./week-range";

test("getCurrentWeekRange returns browser-local Monday through Sunday", () => {
  expect(getCurrentWeekRange(new Date("2026-08-21T12:00:00"))).toEqual({
    from: "2026-08-17",
    to: "2026-08-23",
  });
});

test.each([
  [null, "2026-08-17"],
  ["", "2026-08-17"],
  ["not-a-date", "2026-08-17"],
  ["2026-08-19", "2026-08-17"],
])("resolveWeekRange resolves %s to its browser-local week", (week, from) => {
  expect(resolveWeekRange(week, new Date("2026-08-21T12:00:00"))).toEqual({
    from,
    to: "2026-08-23",
  });
});

test("getAdjacentWeekStart moves to the previous or next Monday", () => {
  const range = { from: "2026-08-31", to: "2026-09-06" };

  expect(getAdjacentWeekStart(range, -1)).toBe("2026-08-24");
  expect(getAdjacentWeekStart(range, 1)).toBe("2026-09-07");
});
