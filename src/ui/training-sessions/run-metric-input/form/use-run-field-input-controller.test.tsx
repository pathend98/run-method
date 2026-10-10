import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import type { RunningMetricInput as RunFieldInputValue } from "../run-metric-input-model";
import { useRunFieldInputController } from "./use-run-field-input-controller";

const emptyValue: RunFieldInputValue = {
  distance: "",
  durationHours: "00",
  durationMinutes: "00",
  durationSeconds: "00",
  pace: "",
  derivedMetric: null,
};

function useHarness(
  initialValue: RunFieldInputValue,
  onPendingChange: (pending: boolean) => void,
) {
  const [value, setValue] = useState(initialValue);
  const controller = useRunFieldInputController({
    onChange: setValue,
    onPendingChange,
    unit: "KILOMETRES",
    value,
  });
  return { controller, setValue, value };
}

test("derives a metric and recalculates it when an authority changes", () => {
  const { result } = renderHook(() => useHarness(emptyValue, vi.fn()));

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distance: "8",
    });
  });
  act(() => {
    result.current.controller.changeMetric("duration", {
      ...result.current.value,
      durationMinutes: "44",
    });
  });
  expect(result.current.value).toMatchObject({
    derivedMetric: "pace",
    pace: "5:30",
  });

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distance: "10",
    });
  });
  expect(result.current.value.pace).toBe("4:24");
});

test("prompts after an Auto override and moves Auto to the unkept metric", () => {
  const onPendingChange = vi.fn();
  const initialValue: RunFieldInputValue = {
    distance: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pace: "5:30",
    derivedMetric: "pace",
  };
  const { result, unmount } = renderHook(() =>
    useHarness(initialValue, onPendingChange),
  );

  act(() => result.current.controller.beginAutoEdit("pace"));
  act(() => {
    result.current.controller.changeMetric("pace", {
      ...result.current.value,
      pace: "5:20",
    });
  });
  act(() => result.current.controller.finishAutoEdit("pace"));

  expect(result.current.controller.pendingMetric).toBe("pace");
  expect(result.current.controller.authoritativeMetrics).toEqual([
    "distance",
    "duration",
  ]);
  expect(onPendingChange).toHaveBeenLastCalledWith(true);

  act(() => result.current.controller.keepMetric("distance"));
  expect(result.current.value).toMatchObject({
    derivedMetric: "duration",
    durationMinutes: "42",
    durationSeconds: "40",
  });
  expect(onPendingChange).toHaveBeenLastCalledWith(false);

  unmount();
  expect(onPendingChange).toHaveBeenLastCalledWith(false);
});

test("keeps an invalid Auto edit and clears Auto after an invalid authority", () => {
  const initialValue: RunFieldInputValue = {
    distance: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pace: "5:30",
    derivedMetric: "pace",
  };
  const { result } = renderHook(() => useHarness(initialValue, vi.fn()));

  act(() => result.current.controller.beginAutoEdit("pace"));
  act(() => {
    result.current.controller.changeMetric("pace", {
      ...result.current.value,
      pace: "bad",
    });
  });
  act(() => result.current.controller.finishAutoEdit("pace"));
  expect(result.current.value.pace).toBe("bad");

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distance: "",
    });
  });
  expect(result.current.value.pace).toBe("");
});

test("does not calculate an Auto metric after an authority becomes invalid", () => {
  const initialValue: RunFieldInputValue = {
    distance: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pace: "5:30",
    derivedMetric: "pace",
  };
  const { result } = renderHook(() => useHarness(initialValue, vi.fn()));

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distance: "bad",
    });
  });
  expect(result.current.value.pace).toBe("");

  act(() => result.current.controller.beginAutoEdit("pace"));
  expect(() => {
    act(() => result.current.controller.finishAutoEdit("pace"));
  }).not.toThrow();
  expect(result.current.value.pace).toBe("");
});

test("does not apply a stale pending Auto selection after values become invalid", () => {
  const initialValue: RunFieldInputValue = {
    distance: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pace: "5:30",
    derivedMetric: "pace",
  };
  const { result } = renderHook(() => useHarness(initialValue, vi.fn()));

  act(() => result.current.controller.beginAutoEdit("pace"));
  act(() => {
    result.current.controller.changeMetric("pace", {
      ...result.current.value,
      pace: "5:20",
    });
  });
  act(() => result.current.controller.finishAutoEdit("pace"));
  expect(result.current.controller.pendingMetric).toBe("pace");

  act(() => {
    result.current.setValue({
      ...result.current.value,
      distance: "bad",
    });
  });
  act(() => result.current.controller.keepMetric("distance"));

  expect(result.current.value.distance).toBe("bad");
  expect(result.current.controller.pendingMetric).toBe("pace");
});
