import type { RunningMetricIssue, RunningMetricUnit } from "./running-metrics";

const messages = {
  "distance-positive": "Distance must be greater than zero",
  "duration-integer": "Enter a whole number",
  "duration-range": "Enter a value from 00 to 59",
  "duration-positive": "Duration must be greater than zero",
  "pace-format": "Enter pace as mm:ss",
  "pace-positive": "Pace must be greater than zero",
} satisfies Record<
  Exclude<RunningMetricIssue["code"], "distance-format">,
  string
>;

export function runFieldIssueMessage(
  issue: RunningMetricIssue,
  unit: RunningMetricUnit,
) {
  if (issue.code === "distance-format") {
    return `Enter a distance in ${unit === "MILES" ? "miles" : "kilometres"}`;
  }
  return messages[issue.code];
}
