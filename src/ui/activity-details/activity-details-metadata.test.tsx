import { render, screen, within } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { ActivityDetailsModal } from "./activity-details-modal";

const runActivity = {
  id: "run",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T11:30:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

function renderActivityDetails(
  activity: RunTrainingSession | StrengthTrainingSession,
) {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, day: "Monday" });

  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <ActivityDetailsModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
}

test.each([
  [runActivity, "Run · Scheduled · Morning"],
  [
    {
      ...runActivity,
      activityType: "STRENGTH",
      actualDurationSeconds: null,
      id: "strength",
      targetDurationSeconds: 2700,
      timeOfDay: "PM",
      title: "Strength",
    } satisfies StrengthTrainingSession,
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
