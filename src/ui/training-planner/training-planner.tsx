"use client";

import { useState } from "react";

import type { TimeOfDay, TrainingActivity, TrainingDay } from "./types";

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "AM", value: "AM" },
  { label: "Any time", value: null },
  { label: "PM", value: "PM" },
];

type TrainingPlannerProps = {
  week: TrainingDay[];
};

export function TrainingPlanner({ week }: TrainingPlannerProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<TrainingActivity | null>(null);

  return (
    <section
      aria-labelledby="training-planner-heading"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Weekly schedule
        </p>
        <h1
          id="training-planner-heading"
          className="text-3xl font-semibold text-zinc-950 sm:text-4xl"
        >
          Training planner
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          A simple week view for arranging runs, workouts, recovery, and rest
          across morning, flexible, and evening slots.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WeekGrid onSelectActivity={setSelectedActivity} week={week} />
        <ActivityDetailsPanel
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </div>
    </section>
  );
}

type WeekGridProps = {
  onSelectActivity: (activity: TrainingActivity) => void;
  week: TrainingDay[];
};

export function WeekGrid({ onSelectActivity, week }: WeekGridProps) {
  return (
    <div
      aria-label="Weekly training planner"
      className="grid gap-3 lg:grid-cols-7"
      role="list"
    >
      {week.map((day) => (
        <DayColumn
          key={day.day}
          day={day}
          onSelectActivity={onSelectActivity}
        />
      ))}
    </div>
  );
}

type DayColumnProps = {
  day: TrainingDay;
  onSelectActivity: (activity: TrainingActivity) => void;
};

export function DayColumn({ day, onSelectActivity }: DayColumnProps) {
  const populatedTimeSections = timeSections
    .map((section) => ({
      ...section,
      activities: day.activities.filter(
        (activity) => activity.timeOfDay === section.value,
      ),
    }))
    .filter((section) => section.activities.length > 0);

  return (
    <article
      aria-label={day.day}
      aria-labelledby={`${day.day.toLowerCase()}-heading`}
      className="flex min-h-64 flex-col rounded-lg border border-zinc-200 bg-zinc-50"
      role="listitem"
    >
      <header className="border-b border-zinc-200 px-3 py-3">
        <h2
          id={`${day.day.toLowerCase()}-heading`}
          className="text-base font-semibold text-zinc-950"
        >
          {day.day}
        </h2>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3">
        {populatedTimeSections.length > 0 ? (
          populatedTimeSections.map((section) => (
            <TimeOfDaySection
              key={section.label}
              activities={section.activities}
              day={day.day}
              label={section.label}
              onSelectActivity={onSelectActivity}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">No activity scheduled</p>
        )}
      </div>
    </article>
  );
}

type TimeOfDaySectionProps = {
  activities: TrainingActivity[];
  day: TrainingDay["day"];
  label: string;
  onSelectActivity: (activity: TrainingActivity) => void;
};

export function TimeOfDaySection({
  activities,
  day,
  label,
  onSelectActivity,
}: TimeOfDaySectionProps) {
  const headingId = `${day.toLowerCase()}-${label.toLowerCase().replace(" ", "-")}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {label}
      </h3>

      <ul className="flex flex-col gap-2">
        {activities.map((activity) => (
          <li key={activity.id}>
            <TrainingActivityCard
              activity={activity}
              onSelect={() => onSelectActivity(activity)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

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

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-950">{value}</dd>
    </div>
  );
}

function formatActivityType(activityType: TrainingActivity["activityType"]) {
  return activityType === "RUN" ? "Run" : "Strength";
}

function formatStatus(status: TrainingActivity["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}

function formatDistance(metres: number | null) {
  return metres === null ? "None" : `${(metres / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "None";
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatPace(secondsPerKilometre: number | null) {
  if (secondsPerKilometre === null) {
    return "None";
  }

  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds} / km`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
