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

const activities: TrainingActivity[] = [
  {
    id: "mon-easy-run",
    title: "Easy run",
    activityType: "Run",
    day: "Monday",
    timeOfDay: "AM",
    description: "45 minutes conversational pace",
  },
  {
    id: "mon-strides",
    title: "Strides",
    activityType: "Workout",
    day: "Monday",
    timeOfDay: "AM",
    description: "6 x 20 seconds relaxed and fast",
  },
  {
    id: "tue-strength",
    title: "Strength",
    activityType: "Gym",
    day: "Tuesday",
    timeOfDay: "PM",
    description: "Lower body and core",
  },
  {
    id: "wed-intervals",
    title: "Track intervals",
    activityType: "Workout",
    day: "Wednesday",
    timeOfDay: "AM",
    description: "6 x 800m at 10K effort",
  },
  {
    id: "thu-mobility",
    title: "Mobility",
    activityType: "Recovery",
    day: "Thursday",
    timeOfDay: null,
    description: "Hips, calves, and thoracic spine",
  },
  {
    id: "thu-easy-run",
    title: "Easy run",
    activityType: "Run",
    day: "Thursday",
    timeOfDay: "AM",
    description: "35 minutes relaxed",
  },
  {
    id: "thu-yoga",
    title: "Yoga",
    activityType: "Recovery",
    day: "Thursday",
    timeOfDay: "PM",
    description: "Gentle flow and breathing",
  },
  {
    id: "fri-rest",
    title: "Rest day",
    activityType: "Rest",
    day: "Friday",
    timeOfDay: null,
  },
  {
    id: "sat-long-run",
    title: "Long run",
    activityType: "Run",
    day: "Saturday",
    timeOfDay: "AM",
    description: "90 minutes steady on rolling terrain",
  },
  {
    id: "sun-recovery",
    title: "Recovery spin",
    activityType: "Cross-training",
    day: "Sunday",
    timeOfDay: "PM",
    description: "30 minutes easy bike",
  },
];

export const sampleWeek: TrainingDay[] = weekdays.map((day) => ({
  day,
  activities: activities.filter((activity) => activity.day === day),
}));
