"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type { TrainingSession } from "@/domain/training-sessions";

export type TrainingSessionActiveModal =
  | { kind: "add"; date: string | undefined }
  | { kind: "details"; trainingSession: TrainingSession }
  | {
      kind: "complete";
      trainingSession: TrainingSession;
      returnTo: "details" | "review";
    }
  | { kind: "delete"; trainingSession: TrainingSession }
  | { kind: "edit"; trainingSession: TrainingSession }
  | { kind: "move"; trainingSession: TrainingSession }
  | { kind: "review" }
  | {
      kind: "skip";
      trainingSession: TrainingSession;
      returnTo: "details" | "review";
    }
  | null;

type TrainingSessionDialogsStoreState = {
  activeModal: TrainingSessionActiveModal;
};

type TrainingSessionDialogsStoreActions = {
  closeModal: () => void;
  openAddTrainingSession: (date: string | undefined) => void;
  openTrainingSessionDetails: (trainingSession: TrainingSession) => void;
  openCompleteTrainingSession: () => void;
  openCompleteTrainingSessionFromReview: (
    trainingSession: TrainingSession,
  ) => void;
  openDeleteTrainingSession: () => void;
  openEditTrainingSession: () => void;
  openMoveTrainingSession: () => void;
  openSkipTrainingSession: () => void;
  openSkipTrainingSessionFromReview: (trainingSession: TrainingSession) => void;
  returnToTrainingSessionDetails: () => void;
  returnFromTrainingSessionTransition: () => void;
  finishTrainingSessionTransition: () => void;
  openReviewTrainingSessions: () => void;
};

export type TrainingSessionDialogsStore = TrainingSessionDialogsStoreState &
  TrainingSessionDialogsStoreActions;

export type TrainingSessionDialogsStoreApi =
  StoreApi<TrainingSessionDialogsStore>;

export function createTrainingSessionDialogsStore(): TrainingSessionDialogsStoreApi {
  return createStore<TrainingSessionDialogsStore>()((set) => ({
    activeModal: null,
    closeModal: () => set({ activeModal: null }),
    openAddTrainingSession: (date) =>
      set({ activeModal: { kind: "add", date } }),
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

// Context scopes a fresh Zustand store to each mounted provider, avoiding a
// module-global store and resetting its UI state on unmount. Zustand's
// useStore handles subscriptions; Context only supplies the store instance.
const TrainingSessionDialogsStoreContext =
  createContext<TrainingSessionDialogsStoreApi | null>(null);

type TrainingSessionDialogsStoreProviderProps = {
  children: ReactNode;
  store?: TrainingSessionDialogsStoreApi;
};

export function TrainingSessionDialogsStoreProvider({
  children,
  store,
}: TrainingSessionDialogsStoreProviderProps) {
  const [trainingSessionDialogsStore] = useState(
    () => store ?? createTrainingSessionDialogsStore(),
  );

  return (
    <TrainingSessionDialogsStoreContext.Provider
      value={trainingSessionDialogsStore}
    >
      {children}
    </TrainingSessionDialogsStoreContext.Provider>
  );
}

export function useTrainingSessionDialogsStore<T>(
  selector: (store: TrainingSessionDialogsStore) => T,
): T {
  const trainingSessionDialogsStore = useContext(
    TrainingSessionDialogsStoreContext,
  );

  if (!trainingSessionDialogsStore) {
    throw new Error(
      "useTrainingSessionDialogsStore must be used within TrainingSessionDialogsStoreProvider",
    );
  }

  return useStore(trainingSessionDialogsStore, selector);
}
