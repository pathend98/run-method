import { SummaryProgress } from "./summary-progress";

type SummaryMetricProps = {
  completed: string | null;
  completedValue: number;
  isFutureWeek: boolean;
  isPastWeek: boolean;
  label: string;
  scheduled: string | null;
  scheduledValue: number;
  variance: string | null;
};

export function SummaryMetric({
  completed,
  completedValue,
  isFutureWeek,
  isPastWeek,
  label,
  scheduled,
  scheduledValue,
  variance,
}: SummaryMetricProps) {
  const plannedValue = `${scheduled} ${isPastWeek ? "planned" : "scheduled"}`;
  const secondaryValue = variance
    ? `${plannedValue} · ${variance}`
    : plannedValue;

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
        {label}
      </h2>
      {!isFutureWeek ? (
        <p className="text-2xl font-semibold text-zinc-950">{completed}</p>
      ) : (
        <p className="text-2xl font-semibold text-zinc-950">
          {scheduled} scheduled
        </p>
      )}
      {!isFutureWeek ? (
        <p className="text-sm text-zinc-600">{secondaryValue}</p>
      ) : null}
      <SummaryProgress
        completedValue={isFutureWeek ? 0 : completedValue}
        label={label}
        scheduledValue={scheduledValue}
      />
    </div>
  );
}
