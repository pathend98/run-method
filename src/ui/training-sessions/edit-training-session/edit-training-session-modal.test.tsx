import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createTrainingSessionDialogsStore,
  TrainingSessionDialogsStoreProvider,
} from "@/ui/training-sessions/training-session-dialogs";
import { EditTrainingSessionModal } from "./edit-training-session-modal";

const api = vi.hoisted(() => ({ editTrainingSession: vi.fn() }));

vi.mock("@/ui/training-sessions/api", async (importOriginal) => ({
  ...(await importOriginal()),
  editTrainingSession: api.editTrainingSession,
}));

const trainingSession = createRunTrainingSession({
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

type EditTrainingSessionModalTestProps = {
  onEdit?: (id: string, request: unknown) => Promise<RunTrainingSession>;
};

function renderEditTrainingSessionModal(
  props: EditTrainingSessionModalTestProps = {},
) {
  const store = createTrainingSessionDialogsStore();
  store.getState().openTrainingSessionDetails(trainingSession);
  store.getState().openEditTrainingSession();
  api.editTrainingSession.mockImplementation(
    props.onEdit ?? vi.fn().mockResolvedValue(trainingSession),
  );

  return {
    store,
    ...render(
      <TrainingSessionDialogsStoreProvider store={store}>
        <QueryProvider>
          <EditTrainingSessionModal />
        </QueryProvider>
      </TrainingSessionDialogsStoreProvider>,
    ),
  };
}

test.each([
  "Cancel",
  "Close edit training session",
  "Dismiss edit training session",
])(
  "renders the selected training session and returns to details using %s",
  (dismissLabel) => {
    const { store } = renderEditTrainingSessionModal();
    expect(
      screen.getByRole("dialog", { name: "Edit training session" }),
    ).toBeDefined();
    expect(screen.getByText("Run · Monday, 17 August")).toBeDefined();
    expect(screen.queryByText("2026-08-17")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: dismissLabel }));
    expect(store.getState().activeModal).toEqual({
      kind: "details",
      trainingSession: trainingSession,
    });
  },
);

test("updates the selected training session and closes the edit flow", async () => {
  const onEdit = vi
    .fn()
    .mockResolvedValue({ ...trainingSession, title: "Updated tempo" });
  const { store } = renderEditTrainingSessionModal({ onEdit });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(store.getState().activeModal).toBeNull();
  expect(
    screen.queryByRole("dialog", { name: "Edit training session" }),
  ).toBeNull();
});

test("keeps the modal open after a failed edit", async () => {
  renderEditTrainingSessionModal({
    onEdit: vi.fn().mockRejectedValue(new Error("nope")),
  });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Changed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to edit training session",
  );
});

test("renders nothing when edit training session is not active", () => {
  render(
    <TrainingSessionDialogsStoreProvider>
      <QueryProvider>
        <EditTrainingSessionModal />
      </QueryProvider>
    </TrainingSessionDialogsStoreProvider>,
  );

  expect(
    screen.queryByRole("dialog", { name: "Edit training session" }),
  ).toBeNull();
});

test("shows its submitting state", async () => {
  renderEditTrainingSessionModal({
    onEdit: () => new Promise(() => undefined),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("button", { name: "Saving…" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("disables saving while an automatic metric edit needs a choice", () => {
  renderEditTrainingSessionModal();
  const dialog = screen.getByRole("dialog", { name: "Edit training session" });
  expect(dialog.classList).toContain("sm:max-w-4xl");

  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "4:10" } });
  fireEvent.blur(pace);

  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    false,
  );
});
