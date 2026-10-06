import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { groupSessionsByWeekday } from "./group-sessions-by-weekday";

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
