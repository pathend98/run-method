import { RunningMetrics } from "@/ui/running-metrics/running-metrics";
import { runFieldIssueMessage } from "./run-field-issues";

test("turns shared validation codes into web form messages", () => {
  const kilometres = new RunningMetrics("KILOMETRES");
  const base = {
    distance: "5",
    durationHours: "00",
    durationMinutes: "25",
    durationSeconds: "00",
    pace: "5:00",
    derivedMetric: null,
  };
  const examples = [
    [{ ...base, distance: "bad" }, "Enter a distance in kilometres"],
    [{ ...base, distance: "0" }, "Distance must be greater than zero"],
    [{ ...base, durationHours: "bad" }, "Enter a whole number"],
    [{ ...base, durationMinutes: "60" }, "Enter a value from 00 to 59"],
    [{ ...base, durationMinutes: "00" }, "Duration must be greater than zero"],
    [{ ...base, pace: "bad" }, "Enter pace as mm:ss"],
    [{ ...base, pace: "0:00" }, "Pace must be greater than zero"],
  ] as const;
  for (const [input, message] of examples) {
    const issue = kilometres.validate(input)[0];
    expect(runFieldIssueMessage(issue, "KILOMETRES")).toBe(message);
  }
  const mileIssue = new RunningMetrics("MILES").validate({
    ...base,
    distance: "bad",
  })[0];
  expect(runFieldIssueMessage(mileIssue, "MILES")).toBe(
    "Enter a distance in miles",
  );
});
