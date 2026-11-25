import { format, parseISO } from "date-fns";
import type { TrainingGoal } from "@/domain/training-goals";
import { Button } from "@/ui/shared/button/button";

type TrainingGoalDetailsProps = { goal: TrainingGoal };

export function TrainingGoalDetails({ goal }: TrainingGoalDetailsProps) {
  return (
    <article className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-950">{goal.title}</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-sm text-zinc-500">Purpose</dt>
          <dd className="whitespace-pre-wrap text-zinc-700">{goal.purpose}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-zinc-500">Training intentions</dt>
          <dd className="whitespace-pre-wrap text-zinc-700">
            {goal.trainingIntentions}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500">Start date</dt>
          <dd className="font-medium text-zinc-950">
            <time dateTime={goal.startDate}>
              {format(parseISO(goal.startDate), "d MMMM yyyy")}
            </time>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500">Target date</dt>
          <dd className="font-medium text-zinc-950">
            <time dateTime={goal.targetDate}>
              {format(parseISO(goal.targetDate), "d MMMM yyyy")}
            </time>
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">Complete goal</Button>
        <Button variant="destructive">Discard goal</Button>
      </div>
    </article>
  );
}
