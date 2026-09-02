import { render } from "@testing-library/react";

import type {
  TrainingActivity,
  TrainingDay,
} from "./types/training-planner-types";
import {
  createTrainingPlannerStore,
  useTrainingPlannerStore,
} from "./training-planner-store";

const activity = {
  id: "activity",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;
const day = {
  day: "Monday",
  date: "2026-08-17",
  activities: [],
} satisfies TrainingDay;

test("transitions through add, details, edit, and closed modal states", () => {
  const store = createTrainingPlannerStore();
  store.getState().openAddActivity(day);
  expect(store.getState().activeModal).toEqual({ kind: "add", day });
  store.getState().openActivityDetails(activity);
  store.getState().openEditActivity();
  expect(store.getState().activeModal).toEqual({ kind: "edit", activity });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().closeModal();
  expect(store.getState().activeModal).toBeNull();
});

test("replaces an edited activity and ignores invalid detail transitions", () => {
  const store = createTrainingPlannerStore();
  store.getState().openEditActivity();
  expect(store.getState().activeModal).toBeNull();
  store.getState().returnToActivityDetails();
  store
    .getState()
    .replaceActivityAndShowDetails({ ...activity, title: "Updated tempo" });
  expect(store.getState().activeModal).toMatchObject({
    kind: "details",
    activity: { title: "Updated tempo" },
  });
});

test("requires a provider when using the selector hook", () => {
  function StoreConsumer() {
    useTrainingPlannerStore((state) => state.activeModal);
    return null;
  }

  expect(() => render(<StoreConsumer />)).toThrow(
    "useTrainingPlannerStore must be used within TrainingPlannerStoreProvider",
  );
});
