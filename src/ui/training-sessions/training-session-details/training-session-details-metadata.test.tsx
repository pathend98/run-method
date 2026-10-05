import { render, screen, within } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { TrainingSessionDetailsModal } from "./training-session-details-modal";

const runActivity = createRunActivity({
  id: "run",
  description: "Controlled effort",
  updatedAt: "2026-08-01T11:30:00.000Z",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

function renderActivityDetails(
  activity: RunTrainingSession | StrengthTrainingSession,
) {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, day: "Monday" });

  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <TrainingSessionDetailsModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
}

test.each([
  [runActivity, "Run · Scheduled · Morning"],
  [
    createStrengthActivity({
      id: "strength",
      timeOfDay: "PM",
      description: runActivity.description,
      updatedAt: runActivity.updatedAt,
    }),
    "Strength · Scheduled · Evening",
  ],
  [{ ...runActivity, timeOfDay: null }, "Run · Scheduled · Anytime"],
] as const)("renders %s beneath the activity title", (activity, metadata) => {
  renderActivityDetails(activity);
  const modal = screen.getByRole("dialog", { name: activity.title });
  const title = within(modal).getByRole("heading", { name: activity.title });
  const subtitle = within(modal).getByText(metadata);

  expect(title.compareDocumentPosition(subtitle)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(within(modal).queryByRole("heading", { name: "Details" })).toBeNull();
});
