"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type {
  TrainingActivity,
  TrainingDay,
} from "./types/training-planner-types";

export type { TrainingActivity } from "./types/training-planner-types";

export type TrainingPlannerActiveModal =
  | { kind: "add"; day: TrainingDay }
  | { kind: "details"; activity: TrainingActivity }
  | {
      kind: "complete";
      activity: TrainingActivity;
      returnTo: "details" | "review";
    }
  | { kind: "delete"; activity: TrainingActivity }
  | { kind: "edit"; activity: TrainingActivity }
  | { kind: "review" }
  | { kind: "skip"; activity: TrainingActivity; returnTo: "details" | "review" }
  | null;

type TrainingPlannerStoreState = {
  activeModal: TrainingPlannerActiveModal;
};

type TrainingPlannerStoreActions = {
  closeModal: () => void;
  openAddActivity: (day: TrainingDay) => void;
  openActivityDetails: (activity: TrainingActivity) => void;
  openCompleteActivity: () => void;
  openCompleteActivityFromReview: (activity: TrainingActivity) => void;
  openDeleteActivity: () => void;
  openEditActivity: () => void;
  openSkipActivity: () => void;
  openSkipActivityFromReview: (activity: TrainingActivity) => void;
  replaceActivityAndShowDetails: (activity: TrainingActivity) => void;
  returnToActivityDetails: () => void;
  returnFromActivityTransition: () => void;
  finishActivityTransition: () => void;
  openReviewActivities: () => void;
};

export type TrainingPlannerStore = TrainingPlannerStoreState &
  TrainingPlannerStoreActions;

export type TrainingPlannerStoreApi = StoreApi<TrainingPlannerStore>;

export function createTrainingPlannerStore(): TrainingPlannerStoreApi {
  return createStore<TrainingPlannerStore>()((set) => ({
    activeModal: null,
    closeModal: () => set({ activeModal: null }),
    openAddActivity: (day) => set({ activeModal: { kind: "add", day } }),
    openActivityDetails: (activity) =>
      set({ activeModal: { kind: "details", activity } }),
    openCompleteActivity: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "complete",
                activity: state.activeModal.activity,
                returnTo: "details",
              },
            }
          : state,
      ),
    openCompleteActivityFromReview: (activity) =>
      set({ activeModal: { kind: "complete", activity, returnTo: "review" } }),
    openDeleteActivity: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "delete",
                activity: state.activeModal.activity,
              },
            }
          : state,
      ),
    openEditActivity: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "edit",
                activity: state.activeModal.activity,
              },
            }
          : state,
      ),
    openSkipActivity: () =>
      set((state) =>
        state.activeModal?.kind === "details"
          ? {
              activeModal: {
                kind: "skip",
                activity: state.activeModal.activity,
                returnTo: "details",
              },
            }
          : state,
      ),
    openSkipActivityFromReview: (activity) =>
      set({ activeModal: { kind: "skip", activity, returnTo: "review" } }),
    replaceActivityAndShowDetails: (activity) =>
      set({ activeModal: { kind: "details", activity } }),
    returnToActivityDetails: () =>
      set((state) =>
        state.activeModal?.kind === "edit" ||
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "delete" ||
        state.activeModal?.kind === "skip"
          ? {
              activeModal: {
                kind: "details",
                activity: state.activeModal.activity,
              },
            }
          : state,
      ),
    returnFromActivityTransition: () =>
      set((state) =>
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "skip"
          ? state.activeModal.returnTo === "review"
            ? { activeModal: { kind: "review" } }
            : {
                activeModal: {
                  kind: "details",
                  activity: state.activeModal.activity,
                },
              }
          : state,
      ),
    finishActivityTransition: () =>
      set((state) =>
        state.activeModal?.kind === "complete" ||
        state.activeModal?.kind === "skip"
          ? state.activeModal.returnTo === "review"
            ? { activeModal: { kind: "review" } }
            : { activeModal: null }
          : state,
      ),
    openReviewActivities: () => set({ activeModal: { kind: "review" } }),
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
