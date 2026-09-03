import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import type { RunFieldInputValue } from "../utils/run-field-calculations";
import { useRunFieldInputController } from "./use-run-field-input-controller";

const emptyValue: RunFieldInputValue = {
  distanceKilometres: "",
  durationHours: "00",
  durationMinutes: "00",
  durationSeconds: "00",
  pacePerKilometre: "",
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
    value,
  });
  return { controller, value };
}

test("derives a metric and recalculates it when an authority changes", () => {
  const { result } = renderHook(() => useHarness(emptyValue, vi.fn()));

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distanceKilometres: "8",
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
    pacePerKilometre: "5:30",
  });

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distanceKilometres: "10",
    });
  });
  expect(result.current.value.pacePerKilometre).toBe("4:24");
});

test("prompts after an Auto override and moves Auto to the unkept metric", () => {
  const onPendingChange = vi.fn();
  const initialValue: RunFieldInputValue = {
    distanceKilometres: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pacePerKilometre: "5:30",
    derivedMetric: "pace",
  };
  const { result, unmount } = renderHook(() =>
    useHarness(initialValue, onPendingChange),
  );

  act(() => result.current.controller.beginAutoEdit("pace"));
  act(() => {
    result.current.controller.changeMetric("pace", {
      ...result.current.value,
      pacePerKilometre: "5:20",
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

test("restores an invalid Auto edit and clears Auto after an invalid authority", () => {
  const initialValue: RunFieldInputValue = {
    distanceKilometres: "8",
    durationHours: "00",
    durationMinutes: "44",
    durationSeconds: "00",
    pacePerKilometre: "5:30",
    derivedMetric: "pace",
  };
  const { result } = renderHook(() => useHarness(initialValue, vi.fn()));

  act(() => result.current.controller.beginAutoEdit("pace"));
  act(() => {
    result.current.controller.changeMetric("pace", {
      ...result.current.value,
      pacePerKilometre: "bad",
    });
  });
  act(() => result.current.controller.finishAutoEdit("pace"));
  expect(result.current.value.pacePerKilometre).toBe("5:30");

  act(() => {
    result.current.controller.changeMetric("distance", {
      ...result.current.value,
      distanceKilometres: "",
    });
  });
  expect(result.current.value.pacePerKilometre).toBe("");
});
