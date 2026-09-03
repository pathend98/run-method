import { useEffect, useRef, useState, type FocusEvent } from "react";

import { FormField } from "@/ui/components/form-field";
import styles from "./run-field-input.module.css";
import {
  calculateDerivedMetric,
  clearMetric,
  isValidRunMetric,
  metricLabel,
  otherMetric,
  type RunFieldInputValue,
  type RunFieldMetric,
} from "./utils/run-field-calculations";

export type { RunFieldInputValue, RunFieldMetric };
export { calculateDerivedMetric } from "./utils/run-field-calculations";

export type RunFieldInputErrors = Partial<
  Record<RunFieldMetric, string | undefined>
>;

type RunFieldInputProps = {
  errors?: RunFieldInputErrors;
  onChange: (value: RunFieldInputValue) => void;
  onPendingChange?: (pending: boolean) => void;
  value: RunFieldInputValue;
};

const metricOrder: RunFieldMetric[] = ["distance", "duration", "pace"];

function doNothing() {}

export function RunFieldInput({
  errors = {},
  onChange,
  onPendingChange = doNothing,
  value,
}: RunFieldInputProps) {
  const [enteredMetrics, setEnteredMetrics] = useState<RunFieldMetric[]>(() =>
    metricOrder.filter((metric) => isValidRunMetric(metric, value)),
  );
  const [pendingMetric, setPendingMetric] = useState<RunFieldMetric | null>(
    null,
  );
  const [durationEdited, setDurationEdited] = useState(
    () => !isZeroDuration(value),
  );
  const autoValueOnFocus = useRef<RunFieldInputValue | null>(null);

  useEffect(
    () => () => {
      onPendingChange(false);
    },
    [onPendingChange],
  );

  function setPending(metric: RunFieldMetric | null) {
    setPendingMetric(metric);
    onPendingChange(metric !== null);
  }

  function changeMetric(metric: RunFieldMetric, next: RunFieldInputValue) {
    if (pendingMetric !== null) setPending(null);

    if (value.derivedMetric === metric) {
      onChange(next);
      return;
    }

    if (value.derivedMetric !== null) {
      if (!isValidRunMetric(metric, next)) {
        onChange(clearMetric(next, value.derivedMetric));
        return;
      }
      onChange(calculateDerivedMetric(next, value.derivedMetric) ?? next);
      return;
    }

    let nextEntered = enteredMetrics.filter((entered) =>
      isValidRunMetric(entered, next),
    );
    if (isValidRunMetric(metric, next) && !nextEntered.includes(metric)) {
      nextEntered = [...nextEntered, metric];
    }
    setEnteredMetrics(nextEntered);

    if (nextEntered.length >= 2) {
      const derivedMetric = otherMetric(nextEntered[0], nextEntered[1]);
      onChange(calculateDerivedMetric(next, derivedMetric)!);
      return;
    }
    onChange(next);
  }

  function beginAutoEdit(metric: RunFieldMetric) {
    if (value.derivedMetric === metric) autoValueOnFocus.current = value;
  }

  function finishAutoEdit(metric: RunFieldMetric) {
    if (value.derivedMetric !== metric || autoValueOnFocus.current === null) {
      return;
    }

    const calculated = calculateDerivedMetric(value, metric);
    if (!isValidRunMetric(metric, value) || calculated === null) {
      onChange(calculateDerivedMetric(autoValueOnFocus.current, metric)!);
      autoValueOnFocus.current = null;
      return;
    }

    if (metricHasSameValue(metric, value, calculated)) {
      onChange(calculated);
      autoValueOnFocus.current = null;
      return;
    }

    setPending(metric);
    autoValueOnFocus.current = null;
  }

  function keepMetric(fixedMetric: RunFieldMetric) {
    const editedMetric = pendingMetric!;
    const nextDerived = otherMetric(editedMetric, fixedMetric);
    onChange(calculateDerivedMetric(value, nextDerived)!);
    setEnteredMetrics([fixedMetric, editedMetric]);
    setPending(null);
  }

  const authoritativeMetrics = value.derivedMetric
    ? metricOrder.filter((metric) => metric !== value.derivedMetric)
    : [];
  const showDurationValue = durationEdited || !isZeroDuration(value);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          error={errors.distance}
          label={fieldLabel(
            "Distance (km)",
            value.derivedMetric === "distance",
          )}
        >
          <input
            inputMode="decimal"
            onBlur={() => finishAutoEdit("distance")}
            onChange={(event) =>
              changeMetric("distance", {
                ...value,
                distanceKilometres: event.target.value,
              })
            }
            onFocus={() => beginAutoEdit("distance")}
            placeholder="8"
            value={value.distanceKilometres}
          />
        </FormField>

        <FormField
          error={errors.duration}
          label={fieldLabel(
            "Duration (hh:mm:ss)",
            value.derivedMetric === "duration",
          )}
        >
          <span
            className={styles.durationInputs}
            onBlur={(event) => finishDurationEdit(event)}
            onFocus={() => beginAutoEdit("duration")}
          >
            <input
              aria-label="Duration (hh:mm:ss) hours"
              inputMode="numeric"
              onChange={(event) => {
                setDurationEdited(true);
                changeMetric("duration", {
                  ...value,
                  durationHours: event.target.value,
                });
              }}
              placeholder="hh"
              value={showDurationValue ? value.durationHours : ""}
            />
            <span aria-hidden="true">:</span>
            <input
              aria-label="Duration (minutes)"
              inputMode="numeric"
              maxLength={2}
              onChange={(event) => {
                setDurationEdited(true);
                changeMetric("duration", {
                  ...value,
                  durationMinutes: event.target.value,
                });
              }}
              placeholder="mm"
              value={showDurationValue ? value.durationMinutes : ""}
            />
            <span aria-hidden="true">:</span>
            <input
              aria-label="Duration (hh:mm:ss) seconds"
              inputMode="numeric"
              maxLength={2}
              onChange={(event) => {
                setDurationEdited(true);
                changeMetric("duration", {
                  ...value,
                  durationSeconds: event.target.value,
                });
              }}
              placeholder="ss"
              value={showDurationValue ? value.durationSeconds : ""}
            />
          </span>
        </FormField>

        <FormField
          error={errors.pace}
          label={fieldLabel(
            "Pace (mm:ss / km)",
            value.derivedMetric === "pace",
          )}
        >
          <input
            onBlur={() => finishAutoEdit("pace")}
            onChange={(event) =>
              changeMetric("pace", {
                ...value,
                pacePerKilometre: event.target.value,
              })
            }
            onFocus={() => beginAutoEdit("pace")}
            placeholder="5:30"
            value={value.pacePerKilometre}
          />
        </FormField>
      </div>

      {pendingMetric ? (
        <div
          aria-label={`Choose a fixed value after changing ${metricLabel(pendingMetric)}`}
          className="rounded-md border border-teal-200 bg-teal-50 p-3"
          role="group"
        >
          <p className="text-sm font-medium text-zinc-800">
            Which value should remain fixed?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {authoritativeMetrics.map((metric) => (
              <button
                className="rounded-md border border-teal-700 bg-white px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                key={metric}
                onClick={() => keepMetric(metric)}
                type="button"
              >
                Keep {metricLabel(metric)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  function finishDurationEdit(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      finishAutoEdit("duration");
    }
  }
}

function fieldLabel(label: string, auto: boolean) {
  return auto ? `${label} · Auto` : label;
}

function isZeroDuration(value: RunFieldInputValue) {
  return (
    value.durationHours === "00" &&
    value.durationMinutes === "00" &&
    value.durationSeconds === "00"
  );
}

function metricHasSameValue(
  metric: RunFieldMetric,
  first: RunFieldInputValue,
  second: RunFieldInputValue,
) {
  if (metric === "distance") {
    return first.distanceKilometres === second.distanceKilometres;
  }
  if (metric === "pace") {
    return first.pacePerKilometre === second.pacePerKilometre;
  }
  return (
    first.durationHours === second.durationHours &&
    first.durationMinutes === second.durationMinutes &&
    first.durationSeconds === second.durationSeconds
  );
}
