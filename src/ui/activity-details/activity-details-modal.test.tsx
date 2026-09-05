import {
  fireEvent,
  render as testingRender,
  screen,
  within,
} from "@testing-library/react";
import { addDays, format } from "date-fns";

import { QueryProvider } from "@/app/query-provider";
import type {
  CompleteTrainingSessionRequest,
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { ActivityDetailsModal as ActualActivityDetailsModal } from "./activity-details-modal";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";

const api = vi.hoisted(() => ({
  completeTrainingSession: vi.fn(),
  deleteTrainingSession: vi.fn(),
}));

vi.mock(
  "@/ui/training-sessions/training-sessions-api-client",
  async (importOriginal) => ({
    ...(await importOriginal()),
    completeTrainingSession: api.completeTrainingSession,
    deleteTrainingSession: api.deleteTrainingSession,
  }),
);

const runActivity = {
  id: "run",
  title: "Tempo run",
  status: "SCHEDULED",
  date: format(new Date(), "yyyy-MM-dd"),
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T11:30:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: 5900,
  actualDurationSeconds: 1500,
} satisfies RunTrainingSession;

const strengthActivity = {
  ...runActivity,
  id: "strength",
  title: "Strength",
  activityType: "STRENGTH",
  timeOfDay: "PM",
  targetDurationSeconds: 2700,
  actualDurationSeconds: 2400,
} satisfies StrengthTrainingSession;

type ActivityDetailsModalTestProps = {
  activity: RunTrainingSession | StrengthTrainingSession;
  onClose: () => void;
  onEdit: () => void;
  isDeleting?: boolean;
  isTransitioning?: boolean;
  onComplete?: (
    id: string,
    request: CompleteTrainingSessionRequest,
  ) => Promise<unknown>;
  onDelete?: (id: string) => Promise<void>;
};

const ActivityDetailsModal = ActualActivityDetailsModal as unknown as (
  props: ActivityDetailsModalTestProps,
) => React.ReactElement;

function render(ui: React.ReactElement<ActivityDetailsModalTestProps>) {
  const store = createTrainingPlannerStore();
  let currentProps = ui.props;
  function configureMutationHandlers() {
    api.deleteTrainingSession.mockImplementation(
      currentProps.onDelete ?? vi.fn().mockResolvedValue(undefined),
    );
    api.completeTrainingSession.mockImplementation(
      currentProps.onComplete ?? vi.fn().mockResolvedValue(undefined),
    );
  }

  configureMutationHandlers();
  store
    .getState()
    .openActivityDetails({ ...currentProps.activity, day: "Monday" });
  store.subscribe((state, previousState) => {
    if (
      state.activeModal?.kind === "edit" &&
      previousState.activeModal?.kind === "details"
    ) {
      currentProps.onEdit();
    }
    if (state.activeModal === null && previousState.activeModal !== null) {
      currentProps.onClose();
    }
  });
  const rendered = testingRender(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>{ui}</QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  return {
    ...rendered,
    rerender: (nextUi: React.ReactElement<ActivityDetailsModalTestProps>) => {
      currentProps = nextUi.props;
      configureMutationHandlers();
      store
        .getState()
        .openActivityDetails({ ...currentProps.activity, day: "Monday" });
      rendered.rerender(
        <TrainingPlannerStoreProvider store={store}>
          <QueryProvider>{nextUi}</QueryProvider>
        </TrainingPlannerStoreProvider>,
      );
    },
  };
}

function selectMoreActivityAction(name: "Skip activity" | "Delete activity") {
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name }));
}

function renderActivityDetails(
  overrides: Partial<ActivityDetailsModalTestProps> = {},
) {
  return render(
    <ActivityDetailsModal
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
      {...overrides}
    />,
  );
}

test("calls the close handler from the close button", () => {
  const onClose = vi.fn();
  renderActivityDetails({ onClose });
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the backdrop", () => {
  const onClose = vi.fn();
  renderActivityDetails({ onClose });
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the Escape key", () => {
  const onClose = vi.fn();
  renderActivityDetails({ onClose });
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("ignores non-Escape keys", () => {
  const onClose = vi.fn();
  renderActivityDetails({ onClose });
  fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
  expect(onClose).not.toHaveBeenCalled();
});

test("renders as an accessible large centered modal", () => {
  renderActivityDetails();
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  const overlay = modal.parentElement;
  expect(overlay?.classList.contains("items-center")).toBe(true);
  expect(overlay?.classList.contains("justify-center")).toBe(true);
  expect(modal.classList.contains("max-w-4xl")).toBe(true);
  expect(modal.classList.contains("max-h-[calc(100dvh-2rem)]")).toBe(true);
  expect(modal.classList.contains("rounded-xl")).toBe(true);
  expect(modal.classList.contains("overflow-y-auto")).toBe(true);
  expect(
    within(modal).getByRole("heading", { level: 2, name: "Tempo run" }),
  ).toBeDefined();
});

test("dispatches run activities to the run details component", () => {
  renderActivityDetails();
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  expect(within(modal).queryByText("Target type")).toBeNull();
  expect(within(modal).getByText("4:15 / km")).toBeDefined();
});

test("dispatches strength activities to the strength details component", () => {
  renderActivityDetails({ activity: strengthActivity });
  const modal = screen.getByRole("dialog", { name: "Strength" });
  expect(within(modal).getByText("00:45:00")).toBeDefined();
  expect(within(modal).queryByText("Target pace")).toBeNull();
});

test("calls the edit handler", () => {
  const onEdit = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={onEdit}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
  expect(onEdit).toHaveBeenCalledOnce();
});

test("opens the separate delete modal flow", () => {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...runActivity, day: "Monday" });
  testingRender(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <ActualActivityDetailsModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  selectMoreActivityAction("Delete activity");
  expect(store.getState().activeModal).toMatchObject({ kind: "delete" });
  expect(screen.queryByText("Delete “Tempo run”? ")).toBeNull();
});

test("puts complete in the footer and skip in more actions for eligible activities", () => {
  const { rerender } = render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Edit activity" }).classList,
  ).toContain("border-zinc-200");
  expect(
    screen.getByRole("button", { name: "Edit activity" }).classList,
  ).toContain("py-2");
  expect(
    screen.getByRole("button", { name: "More actions" }).classList,
  ).toContain("size-9");
  expect(
    screen.getByRole("button", { name: "Close activity details" }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Complete activity" }).classList,
  ).toContain("py-2");
  expect(screen.queryByRole("menuitem", { name: "Skip activity" })).toBeNull();
  expect(
    screen.queryByRole("menuitem", { name: "Delete activity" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  expect(
    screen.getByRole("menuitem", { name: "Skip activity" }).classList,
  ).toContain("bg-orange-50");
  expect(
    screen.getByRole("menuitem", { name: "Delete activity" }).classList,
  ).toContain("bg-red-50");

  rerender(
    <ActivityDetailsModal
      activity={{ ...runActivity, status: "COMPLETED" }}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  expect(screen.queryByRole("menuitem", { name: "Skip activity" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Complete activity" }),
  ).toBeNull();
});

test("hides skip and complete actions for future scheduled activities", () => {
  render(
    <ActivityDetailsModal
      activity={{
        ...runActivity,
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      }}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  expect(screen.queryByRole("menuitem", { name: "Skip activity" })).toBeNull();
  expect(
    screen.getByRole("menuitem", { name: "Delete activity" }),
  ).toBeDefined();
  expect(
    screen.queryByRole("button", { name: "Complete activity" }),
  ).toBeNull();
});

test("dismisses more actions with Escape before dismissing the modal", () => {
  const onClose = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", {
    name: "More actions",
  });
  fireEvent.click(trigger);
  const menu = screen.getByRole("menu");
  fireEvent.keyDown(menu, { key: "Enter" });
  expect(screen.getByRole("menu")).toBeDefined();
  fireEvent.keyDown(menu, { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(trigger);
});

test("dismisses more actions when interacting outside the menu", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.pointerDown(
    screen.getByRole("menuitem", { name: "Skip activity" }),
  );
  expect(screen.getByRole("menu")).toBeDefined();
  fireEvent.pointerDown(screen.getByText("Target pace"));

  expect(screen.queryByRole("menu")).toBeNull();
});

test("opens the separate skip modal flow", () => {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...runActivity, day: "Monday" });
  testingRender(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <ActualActivityDetailsModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  selectMoreActivityAction("Skip activity");
  expect(store.getState().activeModal).toMatchObject({ kind: "skip" });
  expect(screen.queryByLabelText("Skip reason")).toBeNull();
});
