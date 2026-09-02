"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type {
  CompleteTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import type {
  TrainingActivity,
  TrainingDay,
} from "./types/training-planner-types";

export type TrainingPlannerActiveModal =
  | { kind: "add"; day: TrainingDay }
  | { kind: "details"; activity: TrainingActivity }
  | { kind: "edit"; activity: TrainingActivity }
  | null;

export type TrainingPlannerModalOperations = {
  createActivity: (request: CreateTrainingSessionRequest) => Promise<TrainingSession>;
  editActivity: (
    id: string,
    request: EditTrainingSessionRequest,
  ) => Promise<TrainingSession>;
  deleteActivity: (id: string) => Promise<void>;
  skipActivity: (
    id: string,
    request: SkipTrainingSessionRequest,
  ) => Promise<TrainingSession>;
  completeActivity: (
    id: string,
    request: CompleteTrainingSessionRequest,
  ) => Promise<TrainingSession>;
  isCreatingActivity: boolean;
  isEditingActivity: boolean;
  isDeletingActivity: boolean;
  isTransitioningActivity: boolean;
};

type TrainingPlannerStoreState = {
  activeModal: TrainingPlannerActiveModal;
  modalOperations: TrainingPlannerModalOperations | null;
};

type TrainingPlannerStoreActions = {
  closeModal: () => void;
  openAddActivity: (day: TrainingDay) => void;
  openActivityDetails: (activity: TrainingActivity) => void;
  openEditActivity: () => void;
  replaceActivityAndShowDetails: (activity: TrainingActivity) => void;
  returnToActivityDetails: () => void;
  setModalOperations: (operations: TrainingPlannerModalOperations) => void;
};

export type TrainingPlannerStore =
  & TrainingPlannerStoreState
  & TrainingPlannerStoreActions;

export type TrainingPlannerStoreApi = StoreApi<TrainingPlannerStore>;

export function createTrainingPlannerStore(): TrainingPlannerStoreApi {
  return createStore<TrainingPlannerStore>()((set) => ({
    activeModal: null,
    modalOperations: null,
    closeModal: () => set({ activeModal: null }),
    openAddActivity: (day) => set({ activeModal: { kind: "add", day } }),
    openActivityDetails: (activity) =>
      set({ activeModal: { kind: "details", activity } }),
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
    replaceActivityAndShowDetails: (activity) =>
      set({ activeModal: { kind: "details", activity } }),
    returnToActivityDetails: () =>
      set((state) =>
        state.activeModal?.kind === "edit"
          ? {
              activeModal: {
                kind: "details",
                activity: state.activeModal.activity,
              },
            }
          : state,
      ),
    setModalOperations: (modalOperations) => set({ modalOperations }),
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
