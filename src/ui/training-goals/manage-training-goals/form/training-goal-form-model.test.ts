import {
  createTrainingGoalFormSchema,
  defaultTrainingGoalFormValues,
  toCreateTrainingGoalRequest,
} from "./training-goal-form-model";

const defaults = { ...defaultTrainingGoalFormValues, title: "  My goal  " };

test("trims the title and omits empty optional values", () => {
  expect(
    JSON.parse(
      JSON.stringify(toCreateTrainingGoalRequest(defaults, "KILOMETRES")),
    ),
  ).toEqual({ title: "My goal", type: "RACE" });
});

test.each(["RACE", "DISTANCE", "CONSISTENCY", "OPEN"] as const)(
  "supports %s goals",
  (type) => {
    expect(
      toCreateTrainingGoalRequest({ ...defaults, type }, "KILOMETRES").type,
    ).toBe(type);
  },
);

test.each([
  ["KILOMETRES", 21100],
  ["MILES", 33957],
] as const)("converts targets using %s", (unit, metres) => {
  expect(
    toCreateTrainingGoalRequest(
      {
        ...defaults,
        distance: "21.1",
        targetDate: "2027-04-12",
        description: "  Half marathon  ",
        durationHours: "01",
        durationMinutes: "30",
        durationSeconds: "15",
      },
      unit,
    ),
  ).toEqual({
    title: "My goal",
    type: "RACE",
    targetDistanceMetres: metres,
    targetDate: "2027-04-12",
    description: "Half marathon",
    targetTimeSeconds: 5415,
  });
});

test.each(["0", "-1", "abc", "1.2345", "1e2", "999999999999999999999"])(
  "rejects invalid distance %s",
  (distance) => {
    expect(
      createTrainingGoalFormSchema("KILOMETRES").safeParse({
        ...defaults,
        distance,
      }).success,
    ).toBe(false);
  },
);

test.each([
  { title: " " },
  { type: "INVALID" },
  { targetDate: "2027-02-30" },
  { durationHours: "-1" },
  { durationMinutes: "60" },
  { durationSeconds: "60" },
  { durationSeconds: "" },
  { durationHours: "99999999999999999" },
])("rejects invalid form values %j", (override) => {
  expect(
    createTrainingGoalFormSchema("KILOMETRES").safeParse({
      ...defaults,
      ...override,
    }).success,
  ).toBe(false);
});
