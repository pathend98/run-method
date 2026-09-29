import type { User } from "@/domain/user-types";

export type RunFieldUnit = User["measurementUnit"];

export function metresPerUnit(unit: RunFieldUnit) {
  return unit === "MILES" ? 1609.344 : 1000;
}

export function distanceToMetres(distance: string, unit: RunFieldUnit) {
  return Math.round(Number(distance) * metresPerUnit(unit));
}

export function formatDistanceInput(
  metres: number,
  unit: RunFieldUnit,
  decimalPlaces = 3,
) {
  return String(Number((metres / metresPerUnit(unit)).toFixed(decimalPlaces)));
}

export function formatPaceInput(secondsPerUnit: number) {
  return `${Math.floor(secondsPerUnit / 60)}:${String(secondsPerUnit % 60).padStart(2, "0")}`;
}
