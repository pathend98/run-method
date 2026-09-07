type SummaryMetricProps = {
  completed: string | null;
  isFutureWeek: boolean;
  label: string;
  scheduled: string | null;
};

export function SummaryMetric({
  completed,
  isFutureWeek,
  label,
  scheduled,
}: SummaryMetricProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
        {label}
      </h2>
      {!isFutureWeek ? (
        <p className="text-sm text-zinc-950">{completed} completed</p>
      ) : null}
      <p className="text-sm text-zinc-600">{scheduled} scheduled</p>
    </div>
  );
}
