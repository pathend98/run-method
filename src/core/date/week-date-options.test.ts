import { getWeekDateOptions } from "./week-date-options";

test("returns Monday through Sunday for the week containing the date", () => {
  expect(getWeekDateOptions("2026-09-10")).toEqual([
    { label: "Monday 7 Sep", value: "2026-09-07" },
    { label: "Tuesday 8 Sep", value: "2026-09-08" },
    { label: "Wednesday 9 Sep", value: "2026-09-09" },
    { label: "Thursday 10 Sep", value: "2026-09-10" },
    { label: "Friday 11 Sep", value: "2026-09-11" },
    { label: "Saturday 12 Sep", value: "2026-09-12" },
    { label: "Sunday 13 Sep", value: "2026-09-13" },
  ]);
});
