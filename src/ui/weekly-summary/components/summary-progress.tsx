import * as Progress from "@radix-ui/react-progress";

type SummaryProgressProps = {
  completedValue: number;
  label: string;
  scheduledValue: number;
};

export function SummaryProgress({
  completedValue,
  label,
  scheduledValue,
}: SummaryProgressProps) {
  const value = getProgressValue(completedValue, scheduledValue);

  return (
    <Progress.Root
      aria-label={`${label} progress`}
      className="h-3 overflow-hidden rounded-full bg-zinc-200"
      max={100}
      value={value}
    >
      <Progress.Indicator
        className="h-full w-full bg-teal-600 transition-transform"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </Progress.Root>
  );
}

function getProgressValue(completedValue: number, scheduledValue: number) {
  if (scheduledValue <= 0) {
    return 0;
  }

  return Math.min(100, (completedValue / scheduledValue) * 100);
}
