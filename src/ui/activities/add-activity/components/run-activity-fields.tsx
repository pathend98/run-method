import { RunFieldFormInput } from "@/ui/activities/run-field-form-input/run-field-form-input";

type RunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function RunActivityFields({ onPendingChange }: RunActivityFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
