import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
  weekdays,
} from "./training-planner-service";

test("weekdays lists Monday through Sunday", () => {
  expect(weekdays).toEqual([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);
});

test("getCurrentWeekRange returns browser-local Monday through Sunday", () => {
  expect(getCurrentWeekRange(new Date("2026-08-21T12:00:00"))).toEqual({
    from: "2026-08-17",
    to: "2026-08-23",
  });
});

test("groupSessionsByWeekday groups API sessions into planner days", () => {
  const week = groupSessionsByWeekday([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Long run",
      activityType: "Run",
      date: "2026-08-22",
      timeOfDay: "AM",
      description: "90 minutes",
      sortOrder: 0,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Mobility",
      activityType: "Recovery",
      date: "2026-08-22",
      timeOfDay: null,
      description: null,
      sortOrder: 1,
    },
  ]);

  expect(week).toEqual([
    { day: "Monday", activities: [] },
    { day: "Tuesday", activities: [] },
    { day: "Wednesday", activities: [] },
    { day: "Thursday", activities: [] },
    { day: "Friday", activities: [] },
    {
      day: "Saturday",
      activities: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Long run",
          activityType: "Run",
          day: "Saturday",
          timeOfDay: "AM",
          description: "90 minutes",
          date: "2026-08-22",
          sortOrder: 0,
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Mobility",
          activityType: "Recovery",
          day: "Saturday",
          timeOfDay: null,
          description: null,
          date: "2026-08-22",
          sortOrder: 1,
        },
      ],
    },
    { day: "Sunday", activities: [] },
  ]);
});
