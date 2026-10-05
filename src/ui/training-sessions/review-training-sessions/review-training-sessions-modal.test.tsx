import { fireEvent, render, screen, within } from "@testing-library/react";
import type { TrainingSession } from "@/domain/training-sessions";
import type { User } from "@/domain/user-types";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { createUser } from "@/test-support/fixtures/user";
import {
  useTrainingPlannerStore,
  type TrainingPlannerStore,
} from "@/ui/training-planner/training-planner-store";
import { useReviewTrainingSessionsQuery } from "./hooks/use-review-training-sessions-query";
import { ReviewTrainingSessionsModal } from "./review-training-sessions-modal";

vi.mock("@/ui/training-planner/training-planner-store", () => ({
  useTrainingPlannerStore: vi.fn(),
}));
vi.mock("./hooks/use-review-training-sessions-query", () => ({
  useReviewTrainingSessionsQuery: vi.fn(() => queryState),
}));
vi.mock("@/ui/users/current-user-query", () => ({
  useCurrentUserQuery: () => ({ data: currentUser }),
}));
vi.mock("@/ui/users/measurement-unit-context", () => ({
  useDistanceDisplayUnit: () => measurementUnit,
}));

let storeState: TrainingPlannerStore;
let queryState: {
  data: TrainingSession[] | undefined;
  isPending: boolean;
  isError: boolean;
};
let currentUser: User | undefined;
let measurementUnit: User["measurementUnit"];

const sessions = [
  createRunTrainingSession({
    title: "Easy run",
    date: "2026-08-31",
    targetDistanceMetres: 12000,
    targetDurationSeconds: 3360,
  }),
  createRunTrainingSession({
    id: "22222222-2222-4222-8222-222222222222",
    title: "Easy run 2",
    date: "2026-08-31",
    targetDurationSeconds: 2460,
  }),
] satisfies TrainingSession[];

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = createUser();
  measurementUnit = "KILOMETRES";
  queryState = { data: sessions, isPending: false, isError: false };
  storeState = {
    activeModal: { kind: "review" },
    closeModal: vi.fn(),
    openAddTrainingSession: vi.fn(),
    openActivityDetails: vi.fn(),
    openCompleteActivity: vi.fn(),
    openCompleteTrainingSessionFromReview: vi.fn(),
    openDeleteTrainingSession: vi.fn(),
    openEditActivity: vi.fn(),
    openMoveTrainingSession: vi.fn(),
    openSkipActivity: vi.fn(),
    openSkipTrainingSessionFromReview: vi.fn(),
    returnToActivityDetails: vi.fn(),
    returnFromActivityTransition: vi.fn(),
    finishActivityTransition: vi.fn(),
    openReviewTrainingSessions: vi.fn(),
  };
  vi.mocked(useTrainingPlannerStore).mockImplementation((selector) =>
    selector(storeState),
  );
});

function renderModal() {
  return render(<ReviewTrainingSessionsModal />);
}

test("groups training sessions by date and renders their planned metrics", () => {
  queryState.data = [
    ...sessions,
    createStrengthTrainingSession({
      title: "Strength session",
      date: "2026-09-01",
      targetDurationSeconds: 1800,
    }),
  ];
  renderModal();
  expect(
    screen.getByRole("dialog", { name: "Training sessions needing attention" }),
  ).toBeDefined();
  expect(screen.getByText("3 training sessions remaining.")).toBeDefined();
  expect(screen.getAllByText("Mon 31 Aug")).toHaveLength(1);
  expect(screen.getByText("Tue 1 Sep")).toBeDefined();
  expect(screen.getByText("12.00 km · 56m")).toBeDefined();
  expect(screen.getByText("8.00 km · 41m")).toBeDefined();
  expect(screen.getByText("30m")).toBeDefined();
  const dateGroup = screen.getByText("Mon 31 Aug").closest("section");
  expect(dateGroup?.classList).toContain("grid");
  expect(dateGroup?.parentElement?.classList).toContain("divide-y");
  expect(within(dateGroup!).getAllByRole("listitem")).toHaveLength(2);
});

test.each([
  ["Complete", "openCompleteTrainingSessionFromReview"],
  ["Skip", "openSkipTrainingSessionFromReview"],
] as const)(
  "calls the %s action with the selected training session and weekday",
  (label, action) => {
    renderModal();
    fireEvent.click(screen.getAllByRole("button", { name: label })[1]);
    expect(storeState[action]).toHaveBeenCalledExactlyOnceWith({
      ...sessions[1],
      day: "Monday",
    });
  },
);

test("renders singular grammar and miles", () => {
  measurementUnit = "MILES";
  queryState.data = [sessions[0]];
  renderModal();
  expect(screen.getByText("1 training session remaining.")).toBeDefined();
  expect(screen.getByText("7.46 mi · 56m")).toBeDefined();
});

test("omits unavailable planned metrics for strength training sessions", () => {
  queryState.data = [
    createStrengthTrainingSession({ targetDurationSeconds: null }),
  ];
  renderModal();
  expect(screen.getByText("Strength")).toBeDefined();
  expect(screen.queryByText(/km|mi|30m/)).toBeNull();
});

test.each([
  "Close",
  "Close training sessions requiring attention",
  "Dismiss training sessions requiring attention",
])("calls close from %s", (label) => {
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: label }));
  expect(storeState.closeModal).toHaveBeenCalledOnce();
});

test("calls close from Escape", () => {
  renderModal();
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test("closes automatically when the review list is empty", () => {
  queryState.data = [];
  renderModal();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(storeState.closeModal).toHaveBeenCalledExactlyOnceWith();
});

test.each(["inactive", "pending", "error", "unavailable"])(
  "renders nothing when %s",
  (state) => {
    if (state === "inactive") {
      storeState.activeModal = null;
      queryState.data = [];
    }
    if (state === "pending") queryState.isPending = true;
    if (state === "error") queryState.isError = true;
    if (state === "unavailable") queryState.data = undefined;
    renderModal();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(storeState.closeModal).not.toHaveBeenCalled();
  },
);

test("passes the current athlete and review enablement to the query hook", () => {
  const { rerender } = renderModal();
  expect(useReviewTrainingSessionsQuery).toHaveBeenLastCalledWith(
    currentUser!.id,
    true,
  );
  storeState.activeModal = null;
  rerender(<ReviewTrainingSessionsModal />);
  expect(useReviewTrainingSessionsQuery).toHaveBeenLastCalledWith(
    currentUser!.id,
    false,
  );
});

test("passes an absent athlete to the query hook without rendering", () => {
  currentUser = undefined;
  queryState = { data: undefined, isPending: true, isError: false };
  renderModal();
  expect(useReviewTrainingSessionsQuery).toHaveBeenCalledWith(undefined, true);
  expect(screen.queryByRole("dialog")).toBeNull();
});
