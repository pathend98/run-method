import { RunFieldFormInput } from "@/ui/training-sessions/run-metric-input";

type RunTrainingSessionFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function RunTrainingSessionFields({
  onPendingChange,
}: RunTrainingSessionFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
