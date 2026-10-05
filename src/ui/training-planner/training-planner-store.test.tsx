import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
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
  ...createRunTrainingSession({
    id: "activity",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  }),
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
  store.getState().openDeleteTrainingSession();
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

test("returns completed and skipped review training sessions to the review modal", () => {
  const store = createTrainingPlannerStore();

  store.getState().openReviewTrainingSessions();
  store.getState().openCompleteTrainingSessionFromReview(activity);
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    activity,
    returnTo: "review",
  });
  store.getState().returnFromActivityTransition();
  expect(store.getState().activeModal).toEqual({ kind: "review" });

  store.getState().openSkipTrainingSessionFromReview(activity);
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
  store.getState().openDeleteTrainingSession();
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
