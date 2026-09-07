import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { AddActivityModal } from "./add-activity-modal";

const api = vi.hoisted(() => ({ createTrainingSession: vi.fn() }));

vi.mock(
  "@/ui/training-sessions/training-sessions-api-client",
  async (importOriginal) => ({
    ...(await importOriginal()),
    createTrainingSession: api.createTrainingSession,
  }),
);

const day = { day: "Monday" as const, date: "2026-08-17", activities: [] };

type AddActivityModalTestProps = {
  onCreate?: (request: unknown) => Promise<unknown>;
};

function renderAddActivityModal(props: AddActivityModalTestProps = {}) {
  const store = createTrainingPlannerStore();
  store.getState().openAddActivity(day);
  api.createTrainingSession.mockImplementation(
    props.onCreate ?? vi.fn().mockResolvedValue({}),
  );

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <QueryProvider>
          <AddActivityModal />
        </QueryProvider>
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("renders time-of-day labels while retaining their request values", () => {
  renderAddActivityModal();

  const options = Array.from(
    screen.getByLabelText("Time of day").querySelectorAll("option"),
  );

  expect(options.map((option) => option.textContent)).toEqual([
    "Morning",
    "Anytime",
    "Evening",
  ]);
  expect(options.map((option) => option.value)).toEqual(["AM", "ANY", "PM"]);
});

test("renders the selected date in a human-readable format", () => {
  renderAddActivityModal();

  expect(screen.getByText("Monday, 17 August")).toBeDefined();
});

test("submits a converted activity for its selected day and closes", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const { store } = renderAddActivityModal({ onCreate });

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));

  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        date: day.date,
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
      }),
    ),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("keeps the form open after a failed creation and supports dismissal", async () => {
  const { store } = renderAddActivityModal({
    onCreate: vi.fn().mockRejectedValue(new Error("nope")),
  });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to add activity",
  );
  expect(store.getState().activeModal?.kind).toBe("add");

  fireEvent.click(screen.getByRole("button", { name: "Close add activity" }));
  expect(store.getState().activeModal).toBeNull();
});

test("switches activity fields and reports validation errors", async () => {
  renderAddActivityModal();
  const activityType = screen.getByLabelText("Activity type");
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(activityType, { target: { value: "STRENGTH" } });
  expect(screen.queryByLabelText("Run target")).toBeNull();
  fireEvent.change(activityType, { target: { value: "RUN" } });
  expect(
    (screen.getByLabelText("Distance (km)") as HTMLInputElement).value,
  ).toBe("8");
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  expect(await screen.findByText("Enter an activity title")).toBeDefined();
});

test("validates invalid fields after they lose focus", async () => {
  renderAddActivityModal();

  fireEvent.blur(screen.getByLabelText("Title"));
  expect(await screen.findByText("Enter an activity title")).toBeDefined();

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "0" },
  });
  fireEvent.blur(screen.getByLabelText("Distance (km)"));
  expect(
    await screen.findByText("Distance must be greater than zero"),
  ).toBeDefined();

  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "1.5" },
  });
  fireEvent.blur(screen.getByLabelText("Duration (minutes)"));
  expect(await screen.findByText("Enter a whole number")).toBeDefined();

  fireEvent.change(screen.getByLabelText(/Pace \(mm:ss \/ km\)/), {
    target: { value: "5:99" },
  });
  fireEvent.blur(screen.getByLabelText(/Pace \(mm:ss \/ km\)/));
  expect(await screen.findByText("Enter pace as mm:ss")).toBeDefined();
});

test("renders nothing when add activity is not active", () => {
  render(
    <TrainingPlannerStoreProvider>
      <QueryProvider>
        <AddActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  expect(screen.queryByRole("dialog", { name: "Add activity" })).toBeNull();
});

test("uses the large modal layout", () => {
  renderAddActivityModal();

  expect(
    screen.getByRole("dialog", { name: "Add activity" }).classList,
  ).toContain("max-w-4xl");
});

test("shows its submitting state", async () => {
  renderAddActivityModal({ onCreate: () => new Promise(() => undefined) });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  expect(await screen.findByRole("button", { name: "Adding…" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("blocks submission while an Auto override is unresolved", () => {
  renderAddActivityModal();
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "44" },
  });
  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "5:20" } });
  fireEvent.blur(pace);

  expect(screen.getByRole("button", { name: "Add activity" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.getByRole("button", { name: "Add activity" })).toHaveProperty(
    "disabled",
    false,
  );
});
