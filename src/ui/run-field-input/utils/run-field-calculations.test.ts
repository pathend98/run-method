import {
  calculateDerivedMetric,
  clearMetric,
  isValidRunMetric,
  metricLabel,
  otherMetric,
  type RunFieldInputValue,
} from "./run-field-calculations";

const value: RunFieldInputValue = {
  distanceKilometres: "8",
  durationHours: "00",
  durationMinutes: "44",
  durationSeconds: "00",
  pacePerKilometre: "5:30",
  derivedMetric: null,
};

test("calculates each derived run metric at supported precision", () => {
  expect(calculateDerivedMetric(value, "pace")).toMatchObject({
    pacePerKilometre: "5:30",
    derivedMetric: "pace",
  });
  expect(calculateDerivedMetric(value, "duration")).toMatchObject({
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    derivedMetric: "duration",
  });
  expect(
    calculateDerivedMetric(
      { ...value, distanceKilometres: "", durationMinutes: "45" },
      "distance",
    ),
  ).toMatchObject({ distanceKilometres: "8.182", derivedMetric: "distance" });
});

test("validates positive metric values and rejects malformed values", () => {
  expect(isValidRunMetric("distance", value)).toBe(true);
  expect(isValidRunMetric("duration", value)).toBe(true);
  expect(isValidRunMetric("pace", value)).toBe(true);
  expect(
    isValidRunMetric("distance", { ...value, distanceKilometres: "0" }),
  ).toBe(false);
  expect(
    isValidRunMetric("duration", { ...value, durationMinutes: "60" }),
  ).toBe(false);
  expect(isValidRunMetric("pace", { ...value, pacePerKilometre: "5:99" })).toBe(
    false,
  );
  expect(isValidRunMetric("pace", { ...value, pacePerKilometre: "0:00" })).toBe(
    false,
  );
  expect(
    isValidRunMetric("duration", {
      ...value,
      durationHours: "00",
      durationMinutes: "00",
      durationSeconds: "00",
    }),
  ).toBe(false);
});

test("clears a metric and identifies the remaining metric", () => {
  expect(clearMetric(value, "distance").distanceKilometres).toBe("");
  expect(clearMetric(value, "pace").pacePerKilometre).toBe("");
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
      { ...value, durationMinutes: "", pacePerKilometre: "" },
      "distance",
    ),
  ).toBeNull();
});
