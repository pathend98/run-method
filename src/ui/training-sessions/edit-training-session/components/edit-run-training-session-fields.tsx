import { RunFieldFormInput } from "@/ui/runs/run-field-form-input/run-field-form-input";

type EditRunTrainingSessionFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function EditRunTrainingSessionFields({
  onPendingChange,
}: EditRunTrainingSessionFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
