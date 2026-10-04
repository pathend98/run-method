import type { User } from "@/domain/user-types";

export type RunningMetricUnit = User["measurementUnit"];
export type RunningMetric = "distance" | "duration" | "pace";

export type RunningMetricInput = {
  distance: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
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

export class RunningMetrics {
  constructor(private readonly unit: RunningMetricUnit) {}

  distanceInUnit(metres: number) {
    return metres / this.metresPerUnit();
  }

  paceInUnit(secondsPerKilometre: number) {
    return this.unit === "MILES"
      ? Math.round(secondsPerKilometre * 1.609344)
      : secondsPerKilometre;
  }

  paceForRun(distanceMetres: number, durationSeconds: number) {
    return Math.round((durationSeconds * 1000) / distanceMetres);
  }

  prefill(distanceMetres: number, durationSeconds: number) {
    const paceSeconds = Math.max(
      1,
      Math.round((durationSeconds * this.metresPerUnit()) / distanceMetres),
    );
    return {
      distance: this.formatDistanceInput(distanceMetres),
      pace: formatPaceInput(paceSeconds),
    };
  }

  formatDistanceInput(metres: number) {
    return String(Number(this.distanceInUnit(metres).toFixed(3)));
  }

  readDistanceInput(distance: string, originalMetres?: number) {
    if (
      originalMetres !== undefined &&
      distance === this.formatDistanceInput(originalMetres)
    ) {
      return originalMetres;
    }
    return Math.round(Number(distance) * this.metresPerUnit());
  }

  inspect(input: RunningMetricInput) {
    return {
      distance: this.distanceIssue(input.distance) === null,
      duration:
        durationIssues(input).length === 0 && durationSeconds(input) > 0,
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
      durationSeconds(input) === 0
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
    const seconds = valid.duration ? durationSeconds(input) : null;
    const paceSeconds = valid.pace ? parsePace(input.pace) : null;

    if (derivedMetric === "pace" && distanceMetres && seconds) {
      const pace = Math.max(
        1,
        Math.round((seconds * this.metresPerUnit()) / distanceMetres),
      );
      return { ...input, pace: formatPaceInput(pace), derivedMetric };
    }
    if (derivedMetric === "duration" && distanceMetres && paceSeconds) {
      const duration = Math.max(
        1,
        Math.round((distanceMetres * paceSeconds) / this.metresPerUnit()),
      );
      return { ...input, ...formatDurationFields(duration), derivedMetric };
    }
    if (derivedMetric === "distance" && seconds && paceSeconds) {
      const metres = Math.max(
        1,
        Math.round((seconds * this.metresPerUnit()) / paceSeconds),
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

  private metresPerUnit() {
    return this.unit === "MILES" ? 1609.344 : 1000;
  }
}

function durationIssues(input: RunningMetricInput): RunningMetricIssue[] {
  const fields = [
    "durationHours",
    "durationMinutes",
    "durationSeconds",
  ] as const;
  return fields.flatMap((field): RunningMetricIssue[] => {
    const value = input[field];
    if (!/^\d+$/.test(value)) return [{ field, code: "duration-integer" }];
    if (field !== "durationHours" && Number(value) > 59) {
      return [{ field, code: "duration-range" }];
    }
    return [];
  });
}

function durationSeconds(input: RunningMetricInput) {
  return (
    Number(input.durationHours) * 3600 +
    Number(input.durationMinutes) * 60 +
    Number(input.durationSeconds)
  );
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

function formatDurationFields(seconds: number) {
  return {
    durationHours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    durationMinutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    durationSeconds: String(seconds % 60).padStart(2, "0"),
  };
}
