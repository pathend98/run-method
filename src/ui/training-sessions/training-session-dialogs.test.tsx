import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  TrainingSessionDialogsStoreProvider,
  createTrainingSessionDialogsStore,
  useTrainingSessionDialogsStore,
} from "@/ui/training-sessions/training-session-dialogs";

const trainingSession = createRunTrainingSession({
  id: "training-session",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
});
const date = "2026-08-17";

test("transitions through add, details, edit, move, completion, skip, delete, and closed modal states", () => {
  const store = createTrainingSessionDialogsStore();
  store.getState().openAddTrainingSession(date);
  expect(store.getState().activeModal).toEqual({ kind: "add", date });
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
  const store = createTrainingSessionDialogsStore();

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
  const store = createTrainingSessionDialogsStore();
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
  const store = createTrainingSessionDialogsStore();
  store
    .getState()
    .openTrainingSessionDetails({ ...trainingSession, status: "COMPLETED" });

  store.getState().openMoveTrainingSession();

  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("requires a provider when using the selector hook", () => {
  function StoreConsumer() {
    useTrainingSessionDialogsStore((state) => state.activeModal);
    return null;
  }

  expect(() => render(<StoreConsumer />)).toThrow(
    "useTrainingSessionDialogsStore must be used within TrainingSessionDialogsStoreProvider",
  );
});

test("isolates dialog state between mounted providers", () => {
  function DialogConsumer({ label }: { label: string }) {
    const activeModal = useTrainingSessionDialogsStore(
      (state) => state.activeModal,
    );
    const openReview = useTrainingSessionDialogsStore(
      (state) => state.openReviewTrainingSessions,
    );
    return (
      <button onClick={openReview}>
        {label}: {activeModal?.kind ?? "closed"}
      </button>
    );
  }

  render(
    <>
      <TrainingSessionDialogsStoreProvider>
        <DialogConsumer label="First" />
      </TrainingSessionDialogsStoreProvider>
      <TrainingSessionDialogsStoreProvider>
        <DialogConsumer label="Second" />
      </TrainingSessionDialogsStoreProvider>
    </>,
  );

  fireEvent.click(screen.getByRole("button", { name: "First: closed" }));
  expect(screen.getByRole("button", { name: "First: review" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Second: closed" })).toBeDefined();
});
