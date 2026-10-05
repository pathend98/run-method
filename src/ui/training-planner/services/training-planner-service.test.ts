import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
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
  [{ from: "2026-08-17", to: "2026-08-23" }, "17 Aug – 23 Aug"],
  [{ from: "2026-08-31", to: "2026-09-06" }, "31 Aug – 6 Sep"],
  [{ from: "2025-12-29", to: "2026-01-04" }, "29 Dec – 4 Jan"],
])("formatWeekRange formats %#", (range, expected) => {
  expect(formatWeekRange(range)).toBe(expected);
});

test("formatDayDate formats a compact day label", () => {
  expect(formatDayDate("2026-08-17")).toBe("17 Aug");
});

test("groupSessionsByWeekday groups API sessions into planner days", () => {
  const week = groupSessionsByWeekday(
    [
      createRunTrainingSession({
        title: "Long run",
        date: "2026-08-22",
        description: "90 minutes",
        targetDistanceMetres: 18000,
        targetDurationSeconds: 5400,
      }),
      createStrengthTrainingSession({
        id: "22222222-2222-4222-8222-222222222222",
        date: "2026-08-22",
        timeOfDay: null,
        sortOrder: 1,
      }),
    ],
    { from: "2026-08-17", to: "2026-08-23" },
  );

  expect(week).toEqual([
    { day: "Monday", date: "2026-08-17", trainingSessions: [] },
    { day: "Tuesday", date: "2026-08-18", trainingSessions: [] },
    { day: "Wednesday", date: "2026-08-19", trainingSessions: [] },
    { day: "Thursday", date: "2026-08-20", trainingSessions: [] },
    { day: "Friday", date: "2026-08-21", trainingSessions: [] },
    {
      day: "Saturday",
      date: "2026-08-22",
      trainingSessions: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          athleteId: "33333333-3333-4333-8333-333333333333",
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
          athleteId: "33333333-3333-4333-8333-333333333333",
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
    { day: "Sunday", date: "2026-08-23", trainingSessions: [] },
  ]);
});
