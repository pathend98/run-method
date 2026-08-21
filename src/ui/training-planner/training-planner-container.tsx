"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfWeek } from "date-fns";
import type { ReactNode } from "react";

import { fetchTrainingSessions } from "@/api/training-sessions-client";
import type { TrainingSession } from "@/domain/training-sessions";
import { TrainingPlanner } from "./training-planner";
import type { TrainingActivity, TrainingDay, Weekday } from "./types";

const weekdays: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function TrainingPlannerContainer() {
  const weekRange = getCurrentWeekRange();
  const query = useQuery({
    queryKey: ["training-sessions", weekRange.from, weekRange.to],
    queryFn: () => fetchTrainingSessions(weekRange),
  });

  if (query.isPending) {
    return <PlannerStatus message="Loading training planner..." />;
  }

  if (query.isError) {
    return (
      <PlannerStatus
        action={<button onClick={() => void query.refetch()}>Retry</button>}
        message="Unable to load training planner."
      />
    );
  }

  const week = groupSessionsByWeekday(query.data);

  return <TrainingPlanner week={week} />;
}

type PlannerStatusProps = {
  action?: ReactNode;
  message: string;
};

function PlannerStatus({ action, message }: PlannerStatusProps) {
  return (
    <section
      aria-live="polite"
      className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8"
    >
      <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
        Training planner
      </h1>
      <p className="text-sm text-zinc-600">{message}</p>
      {action}
    </section>
  );
}

export function getCurrentWeekRange(now = new Date()) {
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);

  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(sunday, "yyyy-MM-dd"),
  };
}

export function groupSessionsByWeekday(
  sessions: TrainingSession[],
): TrainingDay[] {
  const daysByDate = new Map<string, TrainingActivity[]>();

  for (const session of sessions) {
    const date = new Date(`${session.date}T00:00:00`);
    const day = format(date, "EEEE") as Weekday;
    const activities = daysByDate.get(day) ?? [];
    activities.push({
      id: session.id,
      title: session.title,
      activityType: session.activityType,
      day,
      timeOfDay: session.timeOfDay,
      description: session.description,
      date: session.date,
      sortOrder: session.sortOrder,
    });
    daysByDate.set(day, activities);
  }

  return weekdays.map((day) => ({
    day,
    activities: daysByDate.get(day) ?? [],
  }));
}
