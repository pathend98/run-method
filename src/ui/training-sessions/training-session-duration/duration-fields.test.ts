import {
  defaultDurationFields,
  durationFieldsToSeconds,
  durationSecondsToFields,
} from "./duration-fields";

test("converts duration fields to seconds", () => {
  expect(
    durationFieldsToSeconds({
      durationHours: "01",
      durationMinutes: "02",
      durationSeconds: "03",
    }),
  ).toBe(3723);
});

test.each([
  [45, { durationHours: "00", durationMinutes: "00", durationSeconds: "45" }],
  [3661, { durationHours: "01", durationMinutes: "01", durationSeconds: "01" }],
  [7200, { durationHours: "02", durationMinutes: "00", durationSeconds: "00" }],
])("decomposes %i seconds", (seconds, fields) => {
  expect(durationSecondsToFields(seconds)).toEqual(fields);
});

test("uses zeroed fields for an absent optional duration", () => {
  expect(durationSecondsToFields(null)).toEqual(defaultDurationFields);
});
