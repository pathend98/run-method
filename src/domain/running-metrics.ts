import type { User } from "./user-types";

export type RunningMetricUnit = User["measurementUnit"];

export class RunningMetrics {
  constructor(private readonly unit: RunningMetricUnit) {}

  distanceInUnit(metres: number) {
    return metres / this.metresPerUnit();
  }

  distanceInMetres(distance: number) {
    return Math.round(distance * this.metresPerUnit());
  }

  paceInUnit(secondsPerKilometre: number) {
    return this.unit === "MILES"
      ? Math.round(secondsPerKilometre * 1.609344)
      : secondsPerKilometre;
  }

  paceForRun(distanceMetres: number, durationSeconds: number) {
    return Math.round((durationSeconds * 1000) / distanceMetres);
  }

  paceForDistanceAndDuration(distanceMetres: number, durationSeconds: number) {
    return Math.max(
      1,
      Math.round((durationSeconds * this.metresPerUnit()) / distanceMetres),
    );
  }

  durationForDistanceAndPace(
    distanceMetres: number,
    paceSecondsPerUnit: number,
  ) {
    return Math.max(
      1,
      Math.round((distanceMetres * paceSecondsPerUnit) / this.metresPerUnit()),
    );
  }

  distanceForDurationAndPace(
    durationSeconds: number,
    paceSecondsPerUnit: number,
  ) {
    return Math.max(
      1,
      Math.round((durationSeconds * this.metresPerUnit()) / paceSecondsPerUnit),
    );
  }

  private metresPerUnit() {
    return this.unit === "MILES" ? 1609.344 : 1000;
  }
}
