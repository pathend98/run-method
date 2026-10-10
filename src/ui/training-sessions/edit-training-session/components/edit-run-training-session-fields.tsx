import { RunFieldFormInput } from "@/ui/training-sessions/run-metric-input";

type EditRunTrainingSessionFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function EditRunTrainingSessionFields({
  onPendingChange,
}: EditRunTrainingSessionFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
