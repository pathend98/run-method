import {
  RunningMetrics,
  type RunningMetricUnit,
} from "@/domain/running-metrics";
import {
  formatDistanceInput,
  readDistanceInput,
} from "@/ui/shared/distance-input-model";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
  durationSecondsToFields,
  type DurationFields,
} from "@/ui/shared/duration-form-input";

export type { RunningMetricUnit } from "@/domain/running-metrics";

export type RunningMetric = "distance" | "duration" | "pace";

export type RunningMetricInput = DurationFields & {
  distance: string;
  pace: string;
  derivedMetric: RunningMetric | null;
};

export type RunningMetricIssue = {
  field:
    | "distance"
    | "durationHours"
    | "durationMinutes"
    | "durationSeconds"
    | "pace";
  code:
    | "distance-format"
    | "distance-positive"
    | "duration-integer"
    | "duration-range"
    | "duration-positive"
    | "pace-format"
    | "pace-positive";
};

const metricOrder: RunningMetric[] = ["distance", "duration", "pace"];

export class RunMetricInputModel {
  constructor(private readonly unit: RunningMetricUnit) {}

  prefill(distanceMetres: number, durationSeconds: number) {
    const paceSeconds = new RunningMetrics(
      this.unit,
    ).paceForDistanceAndDuration(distanceMetres, durationSeconds);
    return {
      distance: this.formatDistanceInput(distanceMetres),
      pace: formatPaceInput(paceSeconds),
    };
  }

  formatDistanceInput(metres: number) {
    return formatDistanceInput(metres, this.unit);
  }

  readDistanceInput(distance: string, originalMetres?: number) {
    return readDistanceInput(distance, this.unit, originalMetres);
  }

  inspect(input: RunningMetricInput) {
    return {
      distance: this.distanceIssue(input.distance) === null,
      duration:
        durationIssues(input).length === 0 &&
        durationFieldsToSeconds(input) > 0,
      pace: paceIssue(input.pace) === null,
    };
  }

  validate(
    input: RunningMetricInput,
    requirePace = true,
  ): RunningMetricIssue[] {
    const issues: RunningMetricIssue[] = [];
    const distance = this.distanceIssue(input.distance);
    if (distance) issues.push({ field: "distance", code: distance });
    issues.push(...durationIssues(input));
    if (
      issues.every((issue) => !issue.field.startsWith("duration")) &&
      durationFieldsToSeconds(input) === 0
    ) {
      issues.push({
        field: "durationHours",
        code: "duration-positive",
      });
    }
    if (requirePace) {
      const pace = paceIssue(input.pace);
      if (pace) issues.push({ field: "pace", code: pace });
    }
    return issues;
  }

  derive(
    input: RunningMetricInput,
    derivedMetric: RunningMetric,
  ): RunningMetricInput | null {
    const valid = this.inspect(input);
    const distanceMetres = valid.distance
      ? this.readDistanceInput(input.distance)
      : null;
    const seconds = valid.duration ? durationFieldsToSeconds(input) : null;
    const paceSeconds = valid.pace ? parsePace(input.pace) : null;

    if (derivedMetric === "pace" && distanceMetres && seconds) {
      const pace = new RunningMetrics(this.unit).paceForDistanceAndDuration(
        distanceMetres,
        seconds,
      );
      return { ...input, pace: formatPaceInput(pace), derivedMetric };
    }
    if (derivedMetric === "duration" && distanceMetres && paceSeconds) {
      const duration = new RunningMetrics(this.unit).durationForDistanceAndPace(
        distanceMetres,
        paceSeconds,
      );
      return { ...input, ...durationSecondsToFields(duration), derivedMetric };
    }
    if (derivedMetric === "distance" && seconds && paceSeconds) {
      const metres = new RunningMetrics(this.unit).distanceForDurationAndPace(
        seconds,
        paceSeconds,
      );
      return {
        ...input,
        distance: this.formatDistanceInput(metres),
        derivedMetric,
      };
    }
    return null;
  }

  chooseFixed(
    input: RunningMetricInput,
    edited: RunningMetric,
    fixed: RunningMetric,
  ) {
    return this.derive(input, this.firstDerived(edited, fixed));
  }

  firstDerived(first: RunningMetric, second: RunningMetric) {
    return metricOrder.find((metric) => metric !== first && metric !== second)!;
  }

  clear(input: RunningMetricInput, metric: RunningMetric): RunningMetricInput {
    if (metric === "distance") return { ...input, distance: "" };
    if (metric === "pace") return { ...input, pace: "" };
    return {
      ...input,
      durationHours: "",
      durationMinutes: "",
      durationSeconds: "",
    };
  }

  private distanceIssue(
    value: string,
  ): "distance-format" | "distance-positive" | null {
    if (!/^\d+(?:\.\d{1,3})?$/.test(value)) {
      return "distance-format";
    }
    return Number(value) > 0 ? null : "distance-positive";
  }
}

function durationIssues(input: RunningMetricInput): RunningMetricIssue[] {
  const fields = Object.keys(
    durationFieldsSchema.shape,
  ) as (keyof DurationFields)[];
  return fields.flatMap((field): RunningMetricIssue[] => {
    const result = durationFieldsSchema.shape[field].safeParse(input[field]);
    if (result.success) return [];
    return [
      {
        field,
        code:
          result.error.issues[0].code === "custom"
            ? "duration-range"
            : "duration-integer",
      },
    ];
  });
}

function paceIssue(value: string): "pace-format" | "pace-positive" | null {
  if (!/^\d+:[0-5]\d$/.test(value)) return "pace-format";
  return parsePace(value) > 0 ? null : "pace-positive";
}

function parsePace(value: string) {
  const [minutes, seconds] = value.split(":").map(Number);
  return minutes * 60 + seconds;
}

function formatPaceInput(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
