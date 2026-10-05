import { fireEvent, render, screen, within } from "@testing-library/react";
import { addDays, format } from "date-fns";

import type { TrainingSession } from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import {
  useTrainingPlannerStore,
  type TrainingPlannerStore,
} from "@/ui/training-planner/training-planner-store";
import { TrainingSessionDetailsModal } from "./training-session-details-modal";

vi.mock("@/ui/training-planner/training-planner-store", () => ({
  useTrainingPlannerStore: vi.fn(),
}));

let storeState: TrainingPlannerStore;

beforeEach(() => {
  vi.resetAllMocks();
  storeState = {
    activeModal: null,
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
  vi.mocked(useTrainingPlannerStore).mockImplementation((selector) =>
    selector(storeState),
  );
});

const run = createRunTrainingSession({
  id: "run",
  date: format(new Date(), "yyyy-MM-dd"),
  description: "Controlled effort",
  updatedAt: "2026-08-01T11:30:00.000Z",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: 5900,
  actualDurationSeconds: 1500,
});

const strength = createStrengthTrainingSession({
  id: "strength",
  date: run.date,
  timeOfDay: "PM",
  description: run.description,
  updatedAt: run.updatedAt,
  actualDurationSeconds: 2400,
});

function selectTrainingSession(trainingSession: TrainingSession) {
  storeState.activeModal = {
    kind: "details",
    trainingSession: { ...trainingSession, day: "Monday" },
  };
}

function renderTrainingSessionDetails(trainingSession: TrainingSession = run) {
  selectTrainingSession(trainingSession);
  return render(<TrainingSessionDetailsModal />);
}

function selectMoreTrainingSessionAction(name: "Move" | "Skip" | "Delete") {
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name }));
}

test("calls the close handler from the close button", () => {
  renderTrainingSessionDetails();
  fireEvent.click(
    screen.getByRole("button", { name: "Close training session details" }),
  );
  expect(storeState.closeModal).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the backdrop", () => {
  renderTrainingSessionDetails();
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss training session details" }),
  );
  expect(storeState.closeModal).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the Escape key", () => {
  renderTrainingSessionDetails();
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(storeState.closeModal).toHaveBeenCalledTimes(1);
});

test("ignores non-Escape keys", () => {
  renderTrainingSessionDetails();
  fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
  expect(storeState.closeModal).not.toHaveBeenCalled();
});

test("renders as an accessible full-screen mobile and centered desktop modal", () => {
  renderTrainingSessionDetails();
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  const overlay = modal.parentElement;
  expect(overlay?.classList.contains("items-center")).toBe(true);
  expect(overlay?.classList.contains("justify-center")).toBe(true);
  expect(modal.classList.contains("fixed")).toBe(true);
  expect(modal.classList.contains("inset-0")).toBe(true);
  expect(modal.classList.contains("h-dvh")).toBe(true);
  expect(modal.classList.contains("rounded-none")).toBe(true);
  expect(modal.classList.contains("sm:max-w-4xl")).toBe(true);
  expect(modal.classList.contains("sm:relative")).toBe(true);
  expect(modal.classList.contains("sm:rounded-xl")).toBe(true);
  expect(modal.classList.contains("overflow-y-auto")).toBe(true);
  expect(
    within(modal).getByRole("heading", { level: 2, name: "Tempo run" }),
  ).toBeDefined();
});

test.each([
  [run, "Run · Scheduled · Morning"],
  [strength, "Strength · Scheduled · Evening"],
  [{ ...run, timeOfDay: null }, "Run · Scheduled · Anytime"],
] as const)(
  "renders metadata beneath the training session title (%s, %s)",
  (trainingSession, metadata) => {
    renderTrainingSessionDetails(trainingSession);
    const modal = screen.getByRole("dialog", { name: trainingSession.title });
    const title = within(modal).getByRole("heading", {
      name: trainingSession.title,
    });
    const subtitle = within(modal).getByText(metadata);

    expect(title.compareDocumentPosition(subtitle)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(
      within(modal).queryByRole("heading", { name: "Details" }),
    ).toBeNull();
  },
);

test("dispatches run training sessions to the run details component", () => {
  renderTrainingSessionDetails();
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  expect(within(modal).queryByText("Target type")).toBeNull();
  expect(within(modal).getByText("4:15 / km")).toBeDefined();
});

test("dispatches strength training sessions to the strength details component", () => {
  renderTrainingSessionDetails(strength);
  const modal = screen.getByRole("dialog", { name: "Strength" });
  expect(within(modal).getByText("45m")).toBeDefined();
  expect(within(modal).queryByText("Target pace")).toBeNull();
});

test("calls the edit action", () => {
  renderTrainingSessionDetails();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(storeState.openEditTrainingSession).toHaveBeenCalledExactlyOnceWith();
});

test("calls the complete action", () => {
  renderTrainingSessionDetails();
  fireEvent.click(screen.getByRole("button", { name: "Complete" }));
  expect(
    storeState.openCompleteTrainingSession,
  ).toHaveBeenCalledExactlyOnceWith();
});

test.each([
  ["Move", "openMoveTrainingSession"],
  ["Skip", "openSkipTrainingSession"],
  ["Delete", "openDeleteTrainingSession"],
] as const)("calls the %s action from more actions", (label, action) => {
  renderTrainingSessionDetails();
  selectMoreTrainingSessionAction(label);
  expect(storeState[action]).toHaveBeenCalledExactlyOnceWith();
});

test("puts complete in the footer and skip in more actions for eligible training sessions", () => {
  const { rerender } = renderTrainingSessionDetails();
  expect(screen.getByRole("button", { name: "Edit" }).classList).toContain(
    "border-zinc-200",
  );
  expect(screen.getByRole("button", { name: "Edit" }).classList).toContain(
    "py-2",
  );
  expect(
    screen.getByRole("button", { name: "More actions" }).classList,
  ).toContain("size-9");
  expect(
    screen.getByRole("button", { name: "Close training session details" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Complete" }).classList).toContain(
    "py-2",
  );
  expect(screen.queryByRole("menuitem", { name: "Skip" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Move" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  expect(screen.getByRole("menuitem", { name: "Edit" })).toBeDefined();
  expect(screen.getByRole("menuitem", { name: "Skip" }).classList).toContain(
    "bg-orange-50",
  );
  expect(screen.getByRole("menuitem", { name: "Delete" }).classList).toContain(
    "bg-red-50",
  );

  selectTrainingSession({ ...run, status: "COMPLETED" });
  rerender(<TrainingSessionDetailsModal />);
  expect(screen.queryByRole("menuitem", { name: "Skip" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
});

test("hides skip and complete actions for future scheduled training sessions", () => {
  renderTrainingSessionDetails({
    ...run,
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });

  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  expect(screen.queryByRole("menuitem", { name: "Skip" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
});

test("dismisses more actions with Escape before dismissing the modal", () => {
  renderTrainingSessionDetails();

  const trigger = screen.getByRole("button", {
    name: "More actions",
  });
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu");
  fireEvent.keyDown(menu, { key: "Enter" });
  expect(screen.getByRole("menu")).toBeDefined();
  fireEvent.keyDown(menu, { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  expect(storeState.closeModal).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(trigger);
});

test("dismisses more actions when interacting outside the menu", () => {
  renderTrainingSessionDetails();

  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.pointerDown(screen.getByRole("menuitem", { name: "Skip" }));
  expect(screen.getByRole("menu")).toBeDefined();
  fireEvent.pointerDown(screen.getByText("Target pace"));

  expect(screen.queryByRole("menu")).toBeNull();
});

test.each([null, { kind: "review" } as const])(
  "renders nothing when details are inactive (%j)",
  (activeModal) => {
    storeState.activeModal = activeModal;
    render(<TrainingSessionDetailsModal />);
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);

test.each(["COMPLETED", "SKIPPED"] as const)(
  "hides transition and move actions for %s training sessions",
  (status) => {
    renderTrainingSessionDetails({ ...run, status });
    expect(screen.queryByRole("button", { name: "Complete" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.queryByRole("menuitem", { name: "Move" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Skip" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDefined();
  },
);
