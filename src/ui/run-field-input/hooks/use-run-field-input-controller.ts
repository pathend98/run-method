import { useEffect, useRef, useState } from "react";

import {
  calculateDerivedMetric,
  clearMetric,
  isValidRunMetric,
  otherMetric,
  type RunFieldInputValue,
  type RunFieldMetric,
} from "../utils/run-field-calculations";
import type { RunFieldUnit } from "../run-field-units";

type UseRunFieldInputControllerOptions = {
  onChange: (value: RunFieldInputValue) => void;
  onPendingChange: (pending: boolean) => void;
  unit: RunFieldUnit;
  value: RunFieldInputValue;
};

const metricOrder: RunFieldMetric[] = ["distance", "duration", "pace"];

export function useRunFieldInputController({
  onChange,
  onPendingChange,
  unit,
  value,
}: UseRunFieldInputControllerOptions) {
  const [enteredMetrics, setEnteredMetrics] = useState<RunFieldMetric[]>(() =>
    metricOrder.filter((metric) => isValidRunMetric(metric, value, unit)),
  );
  const [pendingMetric, setPendingMetric] = useState<RunFieldMetric | null>(
    null,
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
      if (!isValidRunMetric(metric, next, unit)) {
        onChange(clearMetric(next, value.derivedMetric));
        return;
      }
      onChange(calculateDerivedMetric(next, value.derivedMetric, unit) ?? next);
      return;
    }

    let nextEntered = enteredMetrics.filter((entered) =>
      isValidRunMetric(entered, next, unit),
    );
    if (isValidRunMetric(metric, next, unit) && !nextEntered.includes(metric)) {
      nextEntered = [...nextEntered, metric];
    }
    setEnteredMetrics(nextEntered);

    if (nextEntered.length >= 2) {
      const derivedMetric = otherMetric(nextEntered[0], nextEntered[1]);
      onChange(calculateDerivedMetric(next, derivedMetric, unit)!);
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

    const calculated = calculateDerivedMetric(value, metric, unit);
    if (!isValidRunMetric(metric, value, unit) || calculated === null) {
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
    const calculated = calculateDerivedMetric(value, nextDerived, unit);
    if (calculated === null) return;
    onChange(calculated);
    setEnteredMetrics([fixedMetric, editedMetric]);
    setPending(null);
  }

  return {
    authoritativeMetrics: value.derivedMetric
      ? metricOrder.filter((metric) => metric !== value.derivedMetric)
      : [],
    beginAutoEdit,
    changeMetric,
    finishAutoEdit,
    keepMetric,
    pendingMetric,
  };
}

function metricHasSameValue(
  metric: RunFieldMetric,
  first: RunFieldInputValue,
  second: RunFieldInputValue,
) {
  if (metric === "distance") {
    return first.distance === second.distance;
  }
  if (metric === "pace") {
    return first.pace === second.pace;
  }
  return (
    first.durationHours === second.durationHours &&
    first.durationMinutes === second.durationMinutes &&
    first.durationSeconds === second.durationSeconds
  );
}
