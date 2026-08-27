import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  toCreateTrainingSessionRequest,
} from "./add-activity-form";

test("converts friendly run values into the create request", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "  Tempo run  ",
        timeOfDay: "AM",
        description: "  Controlled  ",
        distanceKilometres: "6.25",
        durationMinutes: "40",
      },
      "2026-08-17",
    ),
  ).toEqual({
    title: "Tempo run",
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled",
    targetDistanceMetres: 6250,
    targetDurationSeconds: 2400,
  });
});

test("supports pace runs and optional strength duration", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Progression",
        targetType: "DURATION_PACE",
        durationMinutes: "30",
        pacePerKilometre: "4:30",
      },
      "2026-08-17",
    ),
  ).toMatchObject({
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: 270,
  });

  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Lift",
        activityType: "STRENGTH",
      },
      "2026-08-17",
    ),
  ).toMatchObject({ activityType: "STRENGTH", targetDurationSeconds: null });
});

test("rejects incomplete required targets", () => {
  expect(
    addActivityFormSchema.safeParse({
      ...defaultAddActivityFormValues,
      title: "Run",
      distanceKilometres: "5",
    }).success,
  ).toBe(false);
});
