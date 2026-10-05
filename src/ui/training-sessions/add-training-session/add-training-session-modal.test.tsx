import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { AddTrainingSessionModal } from "./add-training-session-modal";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const api = vi.hoisted(() => ({ createTrainingSession: vi.fn() }));

vi.mock("@/ui/training-sessions/api", async (importOriginal) => ({
  ...(await importOriginal()),
  createTrainingSession: api.createTrainingSession,
}));

const day = {
  day: "Monday" as const,
  date: "2026-08-17",
  trainingSessions: [],
};

type AddTrainingSessionModalTestProps = {
  onCreate?: (request: unknown) => Promise<unknown>;
  measurementUnit?: "KILOMETRES" | "MILES";
};

function renderAddTrainingSessionModal(
  props: AddTrainingSessionModalTestProps = {},
) {
  const store = createTrainingPlannerStore();
  store.getState().openAddTrainingSession(day);
  api.createTrainingSession.mockImplementation(
    props.onCreate ?? vi.fn().mockResolvedValue({}),
  );

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <QueryProvider>
          <DistanceDisplayProvider
            measurementUnit={props.measurementUnit ?? "KILOMETRES"}
          >
            <AddTrainingSessionModal athleteId="33333333-3333-4333-8333-333333333333" />
          </DistanceDisplayProvider>
        </QueryProvider>
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("renders time-of-day labels while retaining their request values", () => {
  renderAddTrainingSessionModal();

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
  renderAddTrainingSessionModal();

  expect(screen.getByText("Monday, 17 August")).toBeDefined();
});

test("submits a converted training session for its selected day and closes", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const { store } = renderAddTrainingSessionModal({ onCreate });

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add training session" }));

  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-333333333333",
      expect.objectContaining({
        date: day.date,
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
      }),
    ),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("accepts distance and pace in miles", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  renderAddTrainingSessionModal({ measurementUnit: "MILES", onCreate });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Five miles" },
  });
  fireEvent.change(screen.getByLabelText("Distance (mi)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Pace (mm:ss / mi)"), {
    target: { value: "8:00" },
  });
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "40",
  );
  fireEvent.click(screen.getByRole("button", { name: "Add training session" }));
  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-333333333333",
      expect.objectContaining({
        targetDistanceMetres: 8047,
        targetDurationSeconds: 2400,
      }),
    ),
  );
});

test("keeps the form open after a failed creation and supports dismissal", async () => {
  const { store } = renderAddTrainingSessionModal({
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
  fireEvent.click(screen.getByRole("button", { name: "Add training session" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to add training session",
  );
  expect(store.getState().activeModal?.kind).toBe("add");

  fireEvent.click(
    screen.getByRole("button", { name: "Close add training session" }),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("switches training session fields and reports validation errors", async () => {
  renderAddTrainingSessionModal();
  const activityType = screen.getByLabelText("Training session type");
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(activityType, { target: { value: "STRENGTH" } });
  expect(screen.queryByLabelText("Run target")).toBeNull();
  fireEvent.change(activityType, { target: { value: "RUN" } });
  expect(
    (screen.getByLabelText("Distance (km)") as HTMLInputElement).value,
  ).toBe("8");
  fireEvent.click(screen.getByRole("button", { name: "Add training session" }));
  expect(
    await screen.findByText("Enter a training session title"),
  ).toBeDefined();
});

test("validates invalid fields after they lose focus", async () => {
  renderAddTrainingSessionModal();

  fireEvent.blur(screen.getByLabelText("Title"));
  expect(
    await screen.findByText("Enter a training session title"),
  ).toBeDefined();

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

test("renders nothing when add training session is not active", () => {
  render(
    <TrainingPlannerStoreProvider>
      <QueryProvider>
        <AddTrainingSessionModal athleteId="33333333-3333-4333-8333-333333333333" />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  expect(
    screen.queryByRole("dialog", { name: "Add training session" }),
  ).toBeNull();
});

test("uses the large modal layout", () => {
  renderAddTrainingSessionModal();

  expect(
    screen.getByRole("dialog", { name: "Add training session" }).classList,
  ).toContain("sm:max-w-4xl");
});

test("shows its submitting state", async () => {
  renderAddTrainingSessionModal({
    onCreate: () => new Promise(() => undefined),
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
  fireEvent.click(screen.getByRole("button", { name: "Add training session" }));
  expect(await screen.findByRole("button", { name: "Adding…" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("blocks submission while an Auto override is unresolved", () => {
  renderAddTrainingSessionModal();
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

  expect(
    screen.getByRole("button", { name: "Add training session" }),
  ).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(
    screen.getByRole("button", { name: "Add training session" }),
  ).toHaveProperty("disabled", false);
});
