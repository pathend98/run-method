import { act, fireEvent, render, screen } from "@testing-library/react";

import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import {
  useTrainingSessionDialogsStore,
  type TrainingSessionDialogsStore,
} from "@/ui/training-sessions/training-session-dialogs";
import { DeleteTrainingSessionModal } from "./delete-training-session-modal";

vi.mock("@/ui/training-sessions/training-session-dialogs", () => ({
  useTrainingSessionDialogsStore: vi.fn(),
}));
vi.mock("@/ui/training-sessions/mutations", () => ({
  useDeleteTrainingSessionMutation: () => deleteMutation,
}));

const trainingSession = {
  ...createRunTrainingSession({
    title: "Easy run",
    timeOfDay: null,
    targetDurationSeconds: 2400,
  }),
} as const;

let storeState: TrainingSessionDialogsStore;
let deleteMutation: {
  mutateAsync: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
  isPending: boolean;
  isError: boolean;
};

beforeEach(() => {
  vi.resetAllMocks();
  deleteMutation = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
  };
  storeState = {
    activeModal: { kind: "delete", trainingSession: trainingSession },
    closeModal: vi.fn(),
    openAddTrainingSession: vi.fn(),
    openTrainingSessionDetails: vi.fn(),
    openCompleteTrainingSession: vi.fn(),
    openCompleteTrainingSessionFromReview: vi.fn(),
    openDeleteTrainingSession: vi.fn(),
    openEditTrainingSession: vi.fn(),
    openMoveTrainingSession: vi.fn(),
    openSkipTrainingSession: vi.fn(),
    openSkipTrainingSessionFromReview: vi.fn(),
    returnToTrainingSessionDetails: vi.fn(),
    returnFromTrainingSessionTransition: vi.fn(),
    finishTrainingSessionTransition: vi.fn(),
    openReviewTrainingSessions: vi.fn(),
  };
  vi.mocked(useTrainingSessionDialogsStore).mockImplementation((selector) =>
    selector(storeState),
  );
});

function renderModal() {
  return render(<DeleteTrainingSessionModal />);
}

test.each([null, { kind: "review" } as const])(
  "renders nothing when deletion is inactive (%j)",
  (activeModal) => {
    storeState.activeModal = activeModal;
    renderModal();
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);

test("renders training session confirmation and sticky footer actions", () => {
  renderModal();
  expect(screen.getByRole("dialog", { name: "Easy run" })).toBeDefined();
  expect(screen.getByText("Delete this training session?")).toBeDefined();
  expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
  const cancel = screen.getByRole("button", { name: "Cancel" });
  expect(cancel.parentElement?.classList).toContain("sticky");
  expect(cancel.parentElement?.classList).toContain("bottom-0");
});

test.each([
  "Cancel",
  "Close delete training session",
  "Dismiss delete training session",
])("returns to details from %s", (label) => {
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: label }));
  expect(storeState.returnToTrainingSessionDetails).toHaveBeenCalledOnce();
  expect(deleteMutation.mutateAsync).not.toHaveBeenCalled();
  expect(storeState.closeModal).not.toHaveBeenCalled();
});

test("returns to details from Escape", () => {
  renderModal();
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(storeState.returnToTrainingSessionDetails).toHaveBeenCalledOnce();
});

test("deletes the training session and closes only after success", async () => {
  let resolveDeletion!: () => void;
  deleteMutation.mutateAsync.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveDeletion = resolve;
    }),
  );
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  expect(deleteMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith(
    trainingSession.id,
  );
  expect(storeState.closeModal).not.toHaveBeenCalled();
  await act(async () => resolveDeletion());
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test("keeps the modal open on failure, displays the mutation error, and supports retry", async () => {
  deleteMutation.mutateAsync.mockRejectedValueOnce(
    new Error("Deletion failed"),
  );
  const { rerender } = renderModal();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" })),
  );
  expect(deleteMutation.mutateAsync).toHaveBeenCalledExactlyOnceWith(
    trainingSession.id,
  );
  expect(storeState.closeModal).not.toHaveBeenCalled();
  expect(storeState.returnToTrainingSessionDetails).not.toHaveBeenCalled();
  deleteMutation.isError = true;
  rerender(<DeleteTrainingSessionModal />);
  expect(screen.getByRole("alert").textContent).toBe(
    "Unable to delete training session. Please try again.",
  );
  expect(screen.getByRole("dialog")).toBeDefined();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" })),
  );
  expect(deleteMutation.mutateAsync).toHaveBeenNthCalledWith(
    2,
    trainingSession.id,
  );
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test("disables actions and dismissal while deleting", () => {
  deleteMutation.isPending = true;
  renderModal();
  for (const label of [
    "Deleting…",
    "Cancel",
    "Close delete training session",
    "Dismiss delete training session",
  ]) {
    const button = screen.getByRole("button", { name: label });
    expect(button).toHaveProperty("disabled", true);
    fireEvent.click(button);
  }
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(deleteMutation.mutateAsync).not.toHaveBeenCalled();
  expect(storeState.closeModal).not.toHaveBeenCalled();
  expect(storeState.returnToTrainingSessionDetails).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeDefined();
});
