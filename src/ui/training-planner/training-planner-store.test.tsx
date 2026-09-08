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
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;
const day = {
  day: "Monday",
  date: "2026-08-17",
  activities: [],
} satisfies TrainingDay;

test("transitions through add, details, edit, move, completion, skip, delete, and closed modal states", () => {
  const store = createTrainingPlannerStore();
  store.getState().openAddActivity(day);
  expect(store.getState().activeModal).toEqual({ kind: "add", day });
  store.getState().openActivityDetails(activity);
  store.getState().openEditActivity();
  expect(store.getState().activeModal).toEqual({ kind: "edit", activity });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().openMoveActivity();
  expect(store.getState().activeModal).toEqual({ kind: "move", activity });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().openSkipActivity();
  expect(store.getState().activeModal).toEqual({
    kind: "skip",
    activity,
    returnTo: "details",
  });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().openDeleteActivity();
  expect(store.getState().activeModal).toEqual({ kind: "delete", activity });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().openCompleteActivity();
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    activity,
    returnTo: "details",
  });
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toEqual({ kind: "details", activity });
  store.getState().closeModal();
  expect(store.getState().activeModal).toBeNull();
});

test("returns completed and skipped review activities to the review modal", () => {
  const store = createTrainingPlannerStore();

  store.getState().openReviewActivities();
  store.getState().openCompleteActivityFromReview(activity);
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    activity,
    returnTo: "review",
  });
  store.getState().returnFromActivityTransition();
  expect(store.getState().activeModal).toEqual({ kind: "review" });

  store.getState().openSkipActivityFromReview(activity);
  store.getState().finishActivityTransition();
  expect(store.getState().activeModal).toEqual({ kind: "review" });

  store.getState().openActivityDetails(activity);
  store.getState().openCompleteActivity();
  store.getState().finishActivityTransition();
  expect(store.getState().activeModal).toBeNull();

  store.getState().returnFromActivityTransition();
  store.getState().finishActivityTransition();
  expect(store.getState().activeModal).toBeNull();
});

test("ignores invalid detail transitions", () => {
  const store = createTrainingPlannerStore();
  store.getState().openEditActivity();
  store.getState().openCompleteActivity();
  store.getState().openDeleteActivity();
  store.getState().openSkipActivity();
  store.getState().openMoveActivity();
  expect(store.getState().activeModal).toBeNull();
  store.getState().returnToActivityDetails();
  expect(store.getState().activeModal).toBeNull();
});

test("does not open move activity for non-scheduled details", () => {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, status: "COMPLETED" });

  store.getState().openMoveActivity();

  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
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
