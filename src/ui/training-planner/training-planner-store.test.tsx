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

const trainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
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
  store.getState().openAddTrainingSession(day);
  expect(store.getState().activeModal).toEqual({ kind: "add", day });
  store.getState().openTrainingSessionDetails(trainingSession);
  store.getState().openEditTrainingSession();
  expect(store.getState().activeModal).toEqual({
    kind: "edit",
    trainingSession: trainingSession,
  });
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toEqual({
    kind: "details",
    trainingSession,
  });
  store.getState().openMoveTrainingSession();
  expect(store.getState().activeModal).toEqual({
    kind: "move",
    trainingSession,
  });
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toEqual({
    kind: "details",
    trainingSession,
  });
  store.getState().openSkipTrainingSession();
  expect(store.getState().activeModal).toEqual({
    kind: "skip",
    trainingSession: trainingSession,
    returnTo: "details",
  });
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toEqual({
    kind: "details",
    trainingSession,
  });
  store.getState().openDeleteTrainingSession();
  expect(store.getState().activeModal).toEqual({
    kind: "delete",
    trainingSession,
  });
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toEqual({
    kind: "details",
    trainingSession,
  });
  store.getState().openCompleteTrainingSession();
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    trainingSession: trainingSession,
    returnTo: "details",
  });
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toEqual({
    kind: "details",
    trainingSession,
  });
  store.getState().closeModal();
  expect(store.getState().activeModal).toBeNull();
});

test("returns completed and skipped review training sessions to the review modal", () => {
  const store = createTrainingPlannerStore();

  store.getState().openReviewTrainingSessions();
  store.getState().openCompleteTrainingSessionFromReview(trainingSession);
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    trainingSession: trainingSession,
    returnTo: "review",
  });
  store.getState().returnFromTrainingSessionTransition();
  expect(store.getState().activeModal).toEqual({ kind: "review" });

  store.getState().openSkipTrainingSessionFromReview(trainingSession);
  store.getState().finishTrainingSessionTransition();
  expect(store.getState().activeModal).toEqual({ kind: "review" });

  store.getState().openTrainingSessionDetails(trainingSession);
  store.getState().openCompleteTrainingSession();
  store.getState().finishTrainingSessionTransition();
  expect(store.getState().activeModal).toBeNull();

  store.getState().returnFromTrainingSessionTransition();
  store.getState().finishTrainingSessionTransition();
  expect(store.getState().activeModal).toBeNull();
});

test("ignores invalid detail transitions", () => {
  const store = createTrainingPlannerStore();
  store.getState().openEditTrainingSession();
  store.getState().openCompleteTrainingSession();
  store.getState().openDeleteTrainingSession();
  store.getState().openSkipTrainingSession();
  store.getState().openMoveTrainingSession();
  expect(store.getState().activeModal).toBeNull();
  store.getState().returnToTrainingSessionDetails();
  expect(store.getState().activeModal).toBeNull();
});

test("does not open move training session for non-scheduled details", () => {
  const store = createTrainingPlannerStore();
  store
    .getState()
    .openTrainingSessionDetails({ ...trainingSession, status: "COMPLETED" });

  store.getState().openMoveTrainingSession();

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
