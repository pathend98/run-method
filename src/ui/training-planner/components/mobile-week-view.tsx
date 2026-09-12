"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";

import { Button } from "@/ui/components/button";
import { TrainingActivityCard } from "./training-activity-card";
import type {
  TimeOfDay,
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type MobileWeekViewProps = {
  onAddActivity?: (day: TrainingDay) => void;
  onSelectActivity: (activity: TrainingActivity) => void;
  week: TrainingDay[];
};

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "Morning", value: "AM" },
  { label: "Evening", value: "PM" },
  { label: "Anytime", value: null },
];

export function MobileWeekView({
  onAddActivity,
  onSelectActivity,
  week,
}: MobileWeekViewProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultDay = week.find((day) => day.date === today) ?? week[0];
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    getDayKey(defaultDay),
  );
  const selectedDay =
    week.find((day) => getDayKey(day) === selectedDayKey) ?? defaultDay;

  if (!selectedDay) return null;

  const selectedTabId = getTabId(selectedDay);
  const selectedPanelId = getPanelId(selectedDay);
  const populatedTimeSections = timeSections
    .map((section) => ({
      ...section,
      activities: selectedDay.activities.filter(
        (activity) => activity.timeOfDay === section.value,
      ),
    }))
    .filter((section) => section.activities.length > 0);

  return (
    <section
      aria-label="Mobile weekly training planner"
      className="min-[1155px]:hidden"
    >
      <div
        aria-label="Choose training day"
        className="grid grid-cols-7 border-b border-zinc-200"
        role="tablist"
      >
        {week.map((day) => {
          const dayKey = getDayKey(day);
          const isSelected = dayKey === getDayKey(selectedDay);

          return (
            <button
              aria-controls={getPanelId(day)}
              aria-label={getAccessibleDayLabel(day)}
              aria-selected={isSelected}
              className={`min-w-0 border-b-2 px-0.5 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                isSelected
                  ? "border-teal-600 text-zinc-950"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
              id={getTabId(day)}
              key={dayKey}
              onClick={() => setSelectedDayKey(dayKey)}
              role="tab"
              type="button"
            >
              <span>{day.day.slice(0, 3)}</span>
              {day.date ? (
                <time className="ml-1" dateTime={day.date}>
                  {format(parseISO(day.date), "d")}
                </time>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={selectedTabId}
        className="flex flex-col gap-6 pt-5"
        id={selectedPanelId}
        role="tabpanel"
      >
        {populatedTimeSections.length === 0 ? (
          <p className="text-sm text-zinc-500">Rest day</p>
        ) : (
          populatedTimeSections.map((section) => {
            const headingId = `mobile-${getDayKey(selectedDay)}-${section.label.toLowerCase()}`;

            return (
              <section
                aria-labelledby={headingId}
                className="flex flex-col gap-2"
                key={section.label}
              >
                <h3
                  className="text-xs font-semibold tracking-wide text-zinc-500 uppercase"
                  id={headingId}
                >
                  {section.label}
                </h3>
                <ul className="flex flex-col gap-2">
                  {section.activities.map((activity) => (
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
          })
        )}

        <Button
          aria-label={`Add activity to ${selectedDay.day}`}
          className="self-start px-1 py-1 text-sm hover:text-teal-700 hover:underline"
          onClick={() => onAddActivity?.(selectedDay)}
          variant="tertiary"
        >
          + Add activity
        </Button>
      </div>
    </section>
  );
}

function getDayKey(day: TrainingDay | undefined) {
  return day?.date ?? day?.day ?? "";
}

function getTabId(day: TrainingDay) {
  return `mobile-week-tab-${getDayKey(day)}`;
}

function getPanelId(day: TrainingDay) {
  return `mobile-week-panel-${getDayKey(day)}`;
}

function getAccessibleDayLabel(day: TrainingDay) {
  return day.date
    ? `${day.day} ${format(parseISO(day.date), "d MMMM")}`
    : day.day;
}
