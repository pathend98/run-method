import {
  formatDayDate,
  formatWeekRange,
  getAdjacentWeekStart,
  getCurrentWeekRange,
  groupSessionsByWeekday,
  resolveWeekRange,
} from "./training-planner-service";

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

test.each([
  [{ from: "2026-08-17", to: "2026-08-23" }, "17–23 August 2026"],
  [{ from: "2026-08-31", to: "2026-09-06" }, "31 August–6 September 2026"],
  [{ from: "2025-12-29", to: "2026-01-04" }, "29 December 2025–4 January 2026"],
])("formatWeekRange formats %#", (range, expected) => {
  expect(formatWeekRange(range)).toBe(expected);
});

test("formatDayDate formats a compact day label", () => {
  expect(formatDayDate("2026-08-17")).toBe("17 Aug");
});

test("groupSessionsByWeekday groups API sessions into planner days", () => {
  const week = groupSessionsByWeekday(
    [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Long run",
        activityType: "RUN",
        status: "SCHEDULED",
        date: "2026-08-22",
        timeOfDay: "AM",
        description: "90 minutes",
        sortOrder: 0,
        skipReason: null,
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
        targetDistanceMetres: 18000,
        targetDurationSeconds: 5400,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Strength",
        activityType: "STRENGTH",
        status: "SCHEDULED",
        date: "2026-08-22",
        timeOfDay: null,
        description: null,
        sortOrder: 1,
        skipReason: null,
        createdAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
        targetDurationSeconds: 2700,
        actualDurationSeconds: null,
      },
    ],
    { from: "2026-08-17", to: "2026-08-23" },
  );

  expect(week).toEqual([
    { day: "Monday", date: "2026-08-17", activities: [] },
    { day: "Tuesday", date: "2026-08-18", activities: [] },
    { day: "Wednesday", date: "2026-08-19", activities: [] },
    { day: "Thursday", date: "2026-08-20", activities: [] },
    { day: "Friday", date: "2026-08-21", activities: [] },
    {
      day: "Saturday",
      date: "2026-08-22",
      activities: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Long run",
          activityType: "RUN",
          status: "SCHEDULED",
          day: "Saturday",
          timeOfDay: "AM",
          description: "90 minutes",
          date: "2026-08-22",
          sortOrder: 0,
          skipReason: null,
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-01T10:00:00.000Z",
          targetDistanceMetres: 18000,
          targetDurationSeconds: 5400,
          actualDistanceMetres: null,
          actualDurationSeconds: null,
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Strength",
          activityType: "STRENGTH",
          status: "SCHEDULED",
          day: "Saturday",
          timeOfDay: null,
          description: null,
          date: "2026-08-22",
          sortOrder: 1,
          skipReason: null,
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-01T10:00:00.000Z",
          targetDurationSeconds: 2700,
          actualDurationSeconds: null,
        },
      ],
    },
    { day: "Sunday", date: "2026-08-23", activities: [] },
  ]);
});
