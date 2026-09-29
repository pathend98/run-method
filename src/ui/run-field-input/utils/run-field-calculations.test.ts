import {
  calculateDerivedMetric,
  clearMetric,
  isValidRunMetric,
  metricLabel,
  otherMetric,
  type RunFieldInputValue,
} from "./run-field-calculations";

const value: RunFieldInputValue = {
  distance: "8",
  durationHours: "00",
  durationMinutes: "44",
  durationSeconds: "00",
  pace: "5:30",
  derivedMetric: null,
};

test("calculates each derived run metric at supported precision", () => {
  expect(calculateDerivedMetric(value, "pace", "KILOMETRES")).toMatchObject({
    pace: "5:30",
    derivedMetric: "pace",
  });
  expect(calculateDerivedMetric(value, "duration", "KILOMETRES")).toMatchObject(
    {
      durationHours: "00",
      durationMinutes: "44",
      durationSeconds: "00",
      derivedMetric: "duration",
    },
  );
  expect(
    calculateDerivedMetric(
      { ...value, distance: "", durationMinutes: "45" },
      "distance",
      "KILOMETRES",
    ),
  ).toMatchObject({ distance: "8.182", derivedMetric: "distance" });
});

test("validates positive metric values and rejects malformed values", () => {
  expect(isValidRunMetric("distance", value, "KILOMETRES")).toBe(true);
  expect(isValidRunMetric("duration", value, "KILOMETRES")).toBe(true);
  expect(isValidRunMetric("pace", value, "KILOMETRES")).toBe(true);
  expect(
    isValidRunMetric("distance", { ...value, distance: "0" }, "KILOMETRES"),
  ).toBe(false);
  expect(
    isValidRunMetric(
      "duration",
      { ...value, durationMinutes: "60" },
      "KILOMETRES",
    ),
  ).toBe(false);
  expect(
    isValidRunMetric("pace", { ...value, pace: "5:99" }, "KILOMETRES"),
  ).toBe(false);
  expect(
    isValidRunMetric("pace", { ...value, pace: "0:00" }, "KILOMETRES"),
  ).toBe(false);
  expect(
    isValidRunMetric(
      "duration",
      {
        ...value,
        durationHours: "00",
        durationMinutes: "00",
        durationSeconds: "00",
      },
      "KILOMETRES",
    ),
  ).toBe(false);
});

test("clears a metric and identifies the remaining metric", () => {
  expect(clearMetric(value, "distance").distance).toBe("");
  expect(clearMetric(value, "pace").pace).toBe("");
  expect(clearMetric(value, "duration")).toMatchObject({
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
  });
  expect(otherMetric("distance", "pace")).toBe("duration");
  expect(metricLabel("distance")).toBe("distance");
  expect(metricLabel("duration")).toBe("duration");
  expect(metricLabel("pace")).toBe("pace");
});

test("does not calculate a derived metric without both authorities", () => {
  expect(
    calculateDerivedMetric(
      { ...value, durationMinutes: "", pace: "" },
      "distance",
      "KILOMETRES",
    ),
  ).toBeNull();
});

test("derives pace, duration, and distance in miles", () => {
  const miles = {
    ...value,
    distance: "5",
    durationMinutes: "40",
    pace: "8:00",
  };

  expect(calculateDerivedMetric(miles, "pace", "MILES")).toMatchObject({
    pace: "8:00",
  });
  expect(calculateDerivedMetric(miles, "duration", "MILES")).toMatchObject({
    durationMinutes: "40",
    durationSeconds: "00",
  });
  expect(calculateDerivedMetric(miles, "distance", "MILES")).toMatchObject({
    distance: "5",
  });
  expect(isValidRunMetric("distance", miles, "MILES")).toBe(true);
});
