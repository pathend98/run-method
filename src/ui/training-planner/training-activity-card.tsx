import { formatActivityType } from "./training-planner-formatters";
import type { TrainingActivity } from "./types";

type TrainingActivityCardProps = {
  activity: TrainingActivity;
  onSelect?: () => void;
};

export function TrainingActivityCard({
  activity,
  onSelect,
}: TrainingActivityCardProps) {
  return (
    <button
      aria-label={`View ${activity.title} details`}
      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-zinc-950">{activity.title}</p>
        <p className="text-xs font-medium text-teal-700">
          {formatActivityType(activity.activityType)}
        </p>
        {activity.description ? (
          <p className="text-xs leading-5 text-zinc-600">
            {activity.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
