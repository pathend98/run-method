import { act, fireEvent, render, screen } from "@testing-library/react";

import type {
  EditTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import {
  useTrainingPlannerStore,
  type TrainingPlannerStore,
} from "@/ui/training-planner/training-planner-store";
import { MoveTrainingSessionModal } from "./move-training-session-modal";

vi.mock("@/ui/training-planner/training-planner-store", () => ({
  useTrainingPlannerStore: vi.fn(),
}));
vi.mock("@/ui/training-sessions/mutations", () => ({
  useEditTrainingSessionMutation: () => editMutation,
}));

const trainingSession = {
  ...createRunTrainingSession({
    date: "2026-09-10",
    timeOfDay: "PM",
    description: "Controlled effort",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Thursday",
} as const;

let storeState: TrainingPlannerStore;
let editMutation: {
  mutateAsync: ReturnType<
    typeof vi.fn<
      (variables: {
        id: string;
        request: EditTrainingSessionRequest;
      }) => Promise<TrainingSession>
    >
  >;
  isPending: boolean;
};

beforeEach(() => {
  vi.resetAllMocks();
  editMutation = {
    mutateAsync: vi.fn().mockResolvedValue(trainingSession),
    isPending: false,
  };
  storeState = {
    activeModal: { kind: "move", activity: trainingSession },
    closeModal: vi.fn(),
    openAddTrainingSession: vi.fn(),
    openActivityDetails: vi.fn(),
    openCompleteTrainingSession: vi.fn(),
    openCompleteTrainingSessionFromReview: vi.fn(),
    openDeleteTrainingSession: vi.fn(),
    openEditActivity: vi.fn(),
    openMoveTrainingSession: vi.fn(),
    openSkipTrainingSession: vi.fn(),
    openSkipTrainingSessionFromReview: vi.fn(),
    returnToActivityDetails: vi.fn(),
    returnFromTrainingSessionTransition: vi.fn(),
    finishTrainingSessionTransition: vi.fn(),
    openReviewTrainingSessions: vi.fn(),
  };
  vi.mocked(useTrainingPlannerStore).mockImplementation((selector) =>
    selector(storeState),
  );
});

function renderModal() {
  return render(<MoveTrainingSessionModal />);
}

test.each([null, { kind: "review" } as const])(
  "renders nothing when moving is inactive (%j)",
  (activeModal) => {
    storeState.activeModal = activeModal;
    renderModal();
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);

test("shows the training session's week and current scheduling values", () => {
  renderModal();
  expect(screen.getByRole("dialog", { name: "Move Tempo run" })).toBeDefined();
  expect(screen.getByLabelText("Day")).toHaveProperty("value", "2026-09-10");
  expect(screen.getByLabelText("Time")).toHaveProperty("value", "PM");
  expect(
    screen.getByText("When do you want to do this training session?"),
  ).toBeDefined();
  expect(screen.getAllByRole("option")).toHaveLength(10);
  expect(screen.getByRole("option", { name: "Monday 7 Sep" })).toBeDefined();
  expect(screen.getByRole("option", { name: "Sunday 13 Sep" })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test.each([
  "Cancel",
  "Close move training session",
  "Dismiss move training session",
])("returns to training session details from %s", (label) => {
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: label }));
  expect(storeState.returnToActivityDetails).toHaveBeenCalledOnce();
  expect(editMutation.mutateAsync).not.toHaveBeenCalled();
  expect(storeState.closeModal).not.toHaveBeenCalled();
});

test("returns to training session details from Escape", () => {
  renderModal();
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(storeState.returnToActivityDetails).toHaveBeenCalledOnce();
});

test.each([
  ["AM", "AM"],
  ["PM", "PM"],
  ["ANY", null],
] as const)(
  "moves a run training session to the selected day and %s time",
  async (selectedTime, expectedTime) => {
    renderModal();
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: "2026-09-11" },
    });
    fireEvent.change(screen.getByLabelText("Time"), {
      target: { value: selectedTime },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Move" })),
    );
    expect(editMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
      id: trainingSession.id,
      request: {
        title: trainingSession.title,
        date: "2026-09-11",
        timeOfDay: expectedTime,
        description: trainingSession.description,
        activityType: "RUN",
        targetDistanceMetres: trainingSession.targetDistanceMetres,
        targetDurationSeconds: trainingSession.targetDurationSeconds,
      },
    });
    expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
  },
);

test("moves a strength training session with its original schedule and targets", async () => {
  const strengthTrainingSession = createStrengthTrainingSession({
    date: trainingSession.date,
    timeOfDay: null,
    description: trainingSession.description,
    targetDurationSeconds: null,
  });
  storeState.activeModal = {
    kind: "move",
    activity: { ...strengthTrainingSession, day: "Thursday" },
  };
  renderModal();
  expect(screen.getByLabelText("Time")).toHaveProperty("value", "ANY");
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Move" })),
  );
  expect(editMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith({
    id: strengthTrainingSession.id,
    request: {
      title: strengthTrainingSession.title,
      date: strengthTrainingSession.date,
      timeOfDay: null,
      description: strengthTrainingSession.description,
      activityType: "STRENGTH",
      targetDurationSeconds: null,
    },
  });
});

test("closes only after the move succeeds", async () => {
  let resolveMove!: (value: TrainingSession) => void;
  editMutation.mutateAsync.mockReturnValue(
    new Promise<TrainingSession>((resolve) => {
      resolveMove = resolve;
    }),
  );
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Move" }));
  expect(editMutation.mutateAsync).toHaveBeenCalledOnce();
  expect(storeState.closeModal).not.toHaveBeenCalled();
  await act(async () => resolveMove(trainingSession));
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test("keeps the modal open with an error and allows a successful retry", async () => {
  editMutation.mutateAsync.mockRejectedValueOnce(new Error("Move failed"));
  renderModal();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Move" })),
  );
  expect(screen.getByRole("alert").textContent).toBe(
    "Unable to move training session. Please try again.",
  );
  expect(storeState.closeModal).not.toHaveBeenCalled();
  expect(storeState.returnToActivityDetails).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeDefined();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Move" })),
  );
  expect(editMutation.mutateAsync).toHaveBeenCalledTimes(2);
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test("disables actions and dismissal while moving", () => {
  editMutation.isPending = true;
  renderModal();
  for (const label of [
    "Moving…",
    "Cancel",
    "Close move training session",
    "Dismiss move training session",
  ]) {
    const button = screen.getByRole("button", { name: label });
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
  }
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(editMutation.mutateAsync).not.toHaveBeenCalled();
  expect(storeState.closeModal).not.toHaveBeenCalled();
  expect(storeState.returnToActivityDetails).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeDefined();
});
