import { useEffect, useRef, useState } from "react";

import {
  RunningMetrics,
  type RunningMetricInput as RunFieldInputValue,
  type RunningMetric as RunFieldMetric,
  type RunningMetricUnit as RunFieldUnit,
} from "../../run-metrics";

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
  const runningMetrics = new RunningMetrics(unit);
  const [enteredMetrics, setEnteredMetrics] = useState<RunFieldMetric[]>(() =>
    metricOrder.filter((metric) => runningMetrics.inspect(value)[metric]),
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
      if (!runningMetrics.inspect(next)[metric]) {
        onChange(runningMetrics.clear(next, value.derivedMetric));
        return;
      }
      onChange(runningMetrics.derive(next, value.derivedMetric) ?? next);
      return;
    }

    let nextEntered = enteredMetrics.filter(
      (entered) => runningMetrics.inspect(next)[entered],
    );
    if (runningMetrics.inspect(next)[metric] && !nextEntered.includes(metric)) {
      nextEntered = [...nextEntered, metric];
    }
    setEnteredMetrics(nextEntered);

    if (nextEntered.length >= 2) {
      const derivedMetric = runningMetrics.firstDerived(
        nextEntered[0],
        nextEntered[1],
      );
      onChange(runningMetrics.derive(next, derivedMetric)!);
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

    const calculated = runningMetrics.derive(value, metric);
    if (!runningMetrics.inspect(value)[metric] || calculated === null) {
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
    const calculated = runningMetrics.chooseFixed(
      value,
      editedMetric,
      fixedMetric,
    );
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
