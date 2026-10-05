"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type {
  TrainingActivity,
  TrainingDay,
} from "./types/training-planner-types";

export type { TrainingActivity, Weekday } from "./types/training-planner-types";

export type TrainingPlannerActiveModal =
  | { kind: "add"; day: TrainingDay }
  | { kind: "details"; trainingSession: TrainingActivity }
  | {
      kind: "complete";
      trainingSession: TrainingActivity;
      returnTo: "details" | "review";
    }
  | { kind: "delete"; trainingSession: TrainingActivity }
  | { kind: "edit"; trainingSession: TrainingActivity }
  | { kind: "move"; trainingSession: TrainingActivity }
  | { kind: "review" }
  | {
      kind: "skip";
      trainingSession: TrainingActivity;
      returnTo: "details" | "review";
    }
  | null;

type TrainingPlannerStoreState = {
  activeModal: TrainingPlannerActiveModal;
};

type TrainingPlannerStoreActions = {
  closeModal: () => void;
  openAddTrainingSession: (day: TrainingDay) => void;
  openTrainingSessionDetails: (trainingSession: TrainingActivity) => void;
  openCompleteTrainingSession: () => void;
  openCompleteTrainingSessionFromReview: (
    trainingSession: TrainingActivity,
  ) => void;
  openDeleteTrainingSession: () => void;
  openEditTrainingSession: () => void;
  openMoveTrainingSession: () => void;
  openSkipTrainingSession: () => void;
  openSkipTrainingSessionFromReview: (
    trainingSession: TrainingActivity,
  ) => void;
  returnToTrainingSessionDetails: () => void;
  returnFromTrainingSessionTransition: () => void;
  finishTrainingSessionTransition: () => void;
  openReviewTrainingSessions: () => void;
};

export type TrainingPlannerStore = TrainingPlannerStoreState &
  TrainingPlannerStoreActions;

export type TrainingPlannerStoreApi = StoreApi<TrainingPlannerStore>;

export function createTrainingPlannerStore(): TrainingPlannerStoreApi {
  return createStore<TrainingPlannerStore>()((set) => ({
    activeModal: null,
    closeModal: () => set({ activeModal: null }),
    openAddTrainingSession: (day) => set({ activeModal: { kind: "add", day } }),
    openTrainingSessionDetails: (trainingSession) =>
      set({ activeModal: { kind: "details", trainingSession } }),
    openCompleteTrainingSession: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "complete",
                trainingSession: state.activeModal.trainingSession,
                returnTo: "details",
              },
            }
          : state,
      ),
    openCompleteTrainingSessionFromReview: (trainingSession) =>
      set({
        activeModal: {
          kind: "complete",
          trainingSession,
          returnTo: "review",
        },
      }),
    openDeleteTrainingSession: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "delete",
                trainingSession: state.activeModal.trainingSession,
              },
            }
          : state,
      ),
    openEditTrainingSession: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "edit",
                trainingSession: state.activeModal.trainingSession,
              },
            }
          : state,
      ),
    openMoveTrainingSession: () =>
      set((state) =>
        state.activeModal?.kind === "details" &&
        state.activeModal.trainingSession.status === "SCHEDULED"
          ? {
              activeModal: {
                kind: "move",
                trainingSession: state.activeModal.trainingSession,
              },
            }
          : state,
      ),
    openSkipTrainingSession: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "skip",
                trainingSession: state.activeModal.trainingSession,
                returnTo: "details",
              },
            }
          : state,
      ),
    openSkipTrainingSessionFromReview: (trainingSession) =>
      set({
        activeModal: {
          kind: "skip",
          trainingSession,
          returnTo: "review",
        },
      }),
    returnToTrainingSessionDetails: () =>
      set((state) =>
        state.activeModal?.kind === "edit" ||
        state.activeModal?.kind === "move" ||
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "delete" ||
        state.activeModal?.kind === "skip"
          ? {
              activeModal: {
                kind: "details",
                trainingSession: state.activeModal.trainingSession,
              },
            }
          : state,
      ),
    returnFromTrainingSessionTransition: () =>
      set((state) =>
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "skip"
          ? state.activeModal.returnTo === "review"
            ? { activeModal: { kind: "review" } }
            : {
                activeModal: {
                  kind: "details",
                  trainingSession: state.activeModal.trainingSession,
                },
              }
          : state,
      ),
    finishTrainingSessionTransition: () =>
      set((state) =>
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "skip"
          ? state.activeModal.returnTo === "review"
            ? { activeModal: { kind: "review" } }
            : { activeModal: null }
          : state,
      ),
    openReviewTrainingSessions: () => set({ activeModal: { kind: "review" } }),
  }));
}

// Context scopes a fresh Zustand store to each mounted planner, avoiding a
// module-global store and resetting its UI state on unmount. Zustand's
// useStore handles subscriptions; Context only supplies the store instance.
const TrainingPlannerStoreContext =
  createContext<TrainingPlannerStoreApi | null>(null);

type TrainingPlannerStoreProviderProps = {
  children: ReactNode;
  store?: TrainingPlannerStoreApi;
};

export function TrainingPlannerStoreProvider({
  children,
  store,
}: TrainingPlannerStoreProviderProps) {
  const [trainingPlannerStore] = useState(
    () => store ?? createTrainingPlannerStore(),
  );

  return (
    <TrainingPlannerStoreContext.Provider value={trainingPlannerStore}>
      {children}
    </TrainingPlannerStoreContext.Provider>
  );
}

export function useTrainingPlannerStore<T>(
  selector: (store: TrainingPlannerStore) => T,
): T {
  const trainingPlannerStore = useContext(TrainingPlannerStoreContext);

  if (!trainingPlannerStore) {
    throw new Error(
      "useTrainingPlannerStore must be used within TrainingPlannerStoreProvider",
    );
  }

  return useStore(trainingPlannerStore, selector);
}
