import { format, parseISO } from "date-fns";

import type { TrainingGoal } from "@/domain/training-goals";
import type { User } from "@/domain/user-types";
import {
  formatDistance,
  formatDuration,
} from "@/ui/training-sessions/training-session-metric-formatters";

type TrainingGoalDetailsProps = {
  goal: TrainingGoal;
  unit: User["measurementUnit"];
};

const goalTypeLabels: Record<TrainingGoal["type"], string> = {
  RACE: "Race",
  DISTANCE: "Distance",
  CONSISTENCY: "Consistency",
  OPEN: "Open",
};

export function TrainingGoalDetails({ goal, unit }: TrainingGoalDetailsProps) {
  return (
    <article className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-950">{goal.title}</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-zinc-500">Goal type</dt>
          <dd className="font-medium text-zinc-950">
            {goalTypeLabels[goal.type]}
          </dd>
        </div>
        {goal.targetDate !== undefined ? (
          <div>
            <dt className="text-sm text-zinc-500">Target date</dt>
            <dd className="font-medium text-zinc-950">
              <time dateTime={goal.targetDate}>
                {format(parseISO(goal.targetDate), "d MMMM yyyy")}
              </time>
            </dd>
          </div>
        ) : null}
        {goal.targetDistanceMetres !== undefined ? (
          <div>
            <dt className="text-sm text-zinc-500">Target distance</dt>
            <dd className="font-medium text-zinc-950">
              {formatDistance(goal.targetDistanceMetres, unit)}
            </dd>
          </div>
        ) : null}
        {goal.targetTimeSeconds !== undefined ? (
          <div>
            <dt className="text-sm text-zinc-500">Target finish time</dt>
            <dd className="font-medium text-zinc-950">
              {formatDuration(goal.targetTimeSeconds)}
            </dd>
          </div>
        ) : null}
      </dl>
      {goal.description !== undefined ? (
        <div>
          <h3 className="text-sm text-zinc-500">Description</h3>
          <p className="whitespace-pre-wrap text-zinc-700">
            {goal.description}
          </p>
        </div>
      ) : null}
    </article>
  );
}
