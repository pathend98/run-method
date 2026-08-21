import { DetailTerm } from "./detail-term";
import {
  formatActivityType,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatPace,
  formatStatus,
  formatTargetType,
} from "./training-planner-formatters";
import type { TrainingActivity } from "./types";

type ActivityDetailsPanelProps = {
  activity: TrainingActivity | null;
  onClose: () => void;
};

export function ActivityDetailsPanel({
  activity,
  onClose,
}: ActivityDetailsPanelProps) {
  if (!activity) {
    return (
      <aside
        aria-label="Activity details"
        className="min-h-64 rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500"
      >
        Select an activity to view its full details.
      </aside>
    );
  }

  return (
    <aside
      aria-label="Activity details"
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            {formatActivityType(activity.activityType)}
          </p>
          <h2 className="text-xl font-semibold text-zinc-950">
            {activity.title}
          </h2>
        </div>
        <button
          aria-label="Close activity details"
          className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <DetailTerm label="ID" value={activity.id} />
        <DetailTerm label="Day" value={activity.day} />
        <DetailTerm label="Date" value={activity.date} />
        <DetailTerm label="Time" value={activity.timeOfDay ?? "Any time"} />
        <DetailTerm label="Status" value={formatStatus(activity.status)} />
        <DetailTerm
          label="Description"
          value={activity.description ?? "None"}
        />
        <DetailTerm label="Sort order" value={String(activity.sortOrder)} />
        <DetailTerm
          label="Created"
          value={formatDateTime(activity.createdAt)}
        />
        <DetailTerm
          label="Updated"
          value={formatDateTime(activity.updatedAt)}
        />
        {activity.skipReason ? (
          <DetailTerm label="Skip reason" value={activity.skipReason} />
        ) : null}
        {activity.activityType === "RUN" ? (
          <>
            <DetailTerm
              label="Target type"
              value={formatTargetType(activity.targetType)}
            />
            <DetailTerm
              label="Target distance"
              value={formatDistance(activity.targetDistanceMetres)}
            />
            <DetailTerm
              label="Target duration"
              value={formatDuration(activity.targetDurationSeconds)}
            />
            <DetailTerm
              label="Target pace"
              value={formatPace(activity.targetPaceSecondsPerKilometre)}
            />
            <DetailTerm
              label="Actual distance"
              value={formatDistance(activity.actualDistanceMetres)}
            />
            <DetailTerm
              label="Actual duration"
              value={formatDuration(activity.actualDurationSeconds)}
            />
          </>
        ) : (
          <>
            <DetailTerm
              label="Target duration"
              value={formatDuration(activity.targetDurationSeconds)}
            />
            <DetailTerm
              label="Actual duration"
              value={formatDuration(activity.actualDurationSeconds)}
            />
          </>
        )}
      </dl>
    </aside>
  );
}
