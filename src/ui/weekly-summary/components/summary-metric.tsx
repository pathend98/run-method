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
        <p className="text-2xl font-semibold text-zinc-950">{completed}</p>
      ) : (
        <p className="text-2xl font-semibold text-zinc-950">
          {scheduled} scheduled
        </p>
      )}
      {!isFutureWeek ? (
        <p className="text-sm text-zinc-600">{scheduled} scheduled</p>
      ) : null}
    </div>
  );
}
