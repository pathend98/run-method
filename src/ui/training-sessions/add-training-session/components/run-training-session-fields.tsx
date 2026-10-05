import { RunFieldFormInput } from "@/ui/runs/run-field-form-input/run-field-form-input";

type RunTrainingSessionFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function RunTrainingSessionFields({
  onPendingChange,
}: RunTrainingSessionFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
