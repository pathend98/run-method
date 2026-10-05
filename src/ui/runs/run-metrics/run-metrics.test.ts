import { RunningMetrics, type RunningMetricInput } from "./run-metrics";

const input: RunningMetricInput = {
  distance: "8",
  durationHours: "00",
  durationMinutes: "44",
  durationSeconds: "00",
  pace: "5:30",
  derivedMetric: null,
};

test("converts and validates distance in the selected unit", () => {
  const kilometres = new RunningMetrics("KILOMETRES");
  const miles = new RunningMetrics("MILES");
  expect(kilometres.readDistanceInput("6.25")).toBe(6250);
  expect(miles.readDistanceInput("1")).toBe(1609);
  expect(miles.readDistanceInput("1.001")).toBe(1611);
  expect(miles.distanceInUnit(1609.344)).toBe(1);
  expect(kilometres.validate({ ...input, distance: "0" })[0]).toEqual({
    field: "distance",
    code: "distance-positive",
  });
  expect(miles.validate({ ...input, distance: "1.1234" })[0].code).toBe(
    "distance-format",
  );
});

test("prefills all forms at up to three decimals and preserves unchanged metres", () => {
  const miles = new RunningMetrics("MILES");
  const kilometres = new RunningMetrics("KILOMETRES");
  expect(miles.prefill(6001, 1800)).toMatchObject({ distance: "3.729" });
  expect(kilometres.prefill(6001, 1800)).toMatchObject({ distance: "6.001" });
  expect(miles.readDistanceInput("3.729", 6001)).toBe(6001);
  expect(miles.readDistanceInput("5", 6001)).toBe(8047);
  expect(kilometres.readDistanceInput("6.001", 6001)).toBe(6001);
});

test("derives each Auto metric from the two fixed values", () => {
  const metrics = new RunningMetrics("KILOMETRES");
  expect(metrics.derive(input, "pace")).toMatchObject({
    pace: "5:30",
    derivedMetric: "pace",
  });
  expect(metrics.derive(input, "duration")).toMatchObject({
    durationMinutes: "44",
    durationSeconds: "00",
  });
  expect(
    metrics.derive(
      { ...input, distance: "", durationMinutes: "45" },
      "distance",
    ),
  ).toMatchObject({ distance: "8.182" });
  expect(
    metrics.derive({ ...input, pace: "", durationMinutes: "" }, "distance"),
  ).toBeNull();
});

test("shares the Auto selection rule across frontends", () => {
  const metrics = new RunningMetrics("KILOMETRES");
  expect(metrics.firstDerived("distance", "duration")).toBe("pace");
  expect(
    metrics.chooseFixed({ ...input, pace: "5:20" }, "pace", "distance"),
  ).toMatchObject({
    derivedMetric: "duration",
    durationMinutes: "42",
    durationSeconds: "40",
  });
  expect(metrics.clear(input, "duration")).toMatchObject({
    durationMinutes: "",
  });
  expect(metrics.clear(input, "distance").distance).toBe("");
  expect(metrics.clear(input, "pace").pace).toBe("");
});

test("uses miles for the Auto calculation while keeping canonical pace", () => {
  const metrics = new RunningMetrics("MILES");
  const miles = {
    ...input,
    distance: "5",
    durationMinutes: "40",
    pace: "8:00",
  };
  expect(metrics.derive(miles, "pace")).toMatchObject({ pace: "8:00" });
  expect(metrics.derive(miles, "duration")).toMatchObject({
    durationMinutes: "40",
  });
  expect(metrics.derive(miles, "distance")).toMatchObject({ distance: "5" });
  expect(metrics.paceForRun(5900, 1500)).toBe(254);
  expect(metrics.paceInUnit(300)).toBe(483);
});

test("validates run input as one set of metrics", () => {
  const metrics = new RunningMetrics("KILOMETRES");
  expect(metrics.validate(input)).toEqual([]);
  expect(metrics.inspect(input)).toEqual({
    distance: true,
    duration: true,
    pace: true,
  });
  expect(
    metrics.validate({ ...input, durationMinutes: "60", pace: "5:99" }),
  ).toEqual([
    { field: "durationMinutes", code: "duration-range" },
    { field: "pace", code: "pace-format" },
  ]);
  expect(
    metrics.validate({ ...input, durationMinutes: "00", pace: "0:00" }),
  ).toEqual([
    { field: "durationHours", code: "duration-positive" },
    { field: "pace", code: "pace-positive" },
  ]);
  expect(metrics.validate({ ...input, pace: "" }, false)).toEqual([]);
});
