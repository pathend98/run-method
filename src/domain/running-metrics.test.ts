import { RunningMetrics } from "./running-metrics";

test("converts distances and canonical pace in both measurement units", () => {
  const kilometres = new RunningMetrics("KILOMETRES");
  const miles = new RunningMetrics("MILES");
  expect(kilometres.distanceInUnit(6250)).toBe(6.25);
  expect(miles.distanceInUnit(1609.344)).toBe(1);
  expect(kilometres.distanceInMetres(6.25)).toBe(6250);
  expect(miles.distanceInMetres(1)).toBe(1609);
  expect(miles.distanceInMetres(1.001)).toBe(1611);
  expect(kilometres.paceForRun(5900, 1500)).toBe(254);
  expect(miles.paceForRun(5900, 1500)).toBe(254);
  expect(kilometres.paceInUnit(300)).toBe(300);
  expect(miles.paceInUnit(300)).toBe(483);
});

test("derives numeric metrics in the selected unit", () => {
  const kilometres = new RunningMetrics("KILOMETRES");
  const miles = new RunningMetrics("MILES");
  expect(kilometres.paceForDistanceAndDuration(8000, 2640)).toBe(330);
  expect(kilometres.durationForDistanceAndPace(8000, 330)).toBe(2640);
  expect(kilometres.distanceForDurationAndPace(2700, 330)).toBe(8182);
  expect(miles.paceForDistanceAndDuration(8047, 2400)).toBe(480);
  expect(miles.durationForDistanceAndPace(8047, 480)).toBe(2400);
  expect(miles.distanceForDurationAndPace(2400, 480)).toBe(8047);
});

test("keeps derived numeric metrics at a minimum of one", () => {
  const metrics = new RunningMetrics("KILOMETRES");
  expect(metrics.paceForDistanceAndDuration(10000, 1)).toBe(1);
  expect(metrics.durationForDistanceAndPace(1, 1)).toBe(1);
  expect(metrics.distanceForDurationAndPace(1, 10000)).toBe(1);
});
