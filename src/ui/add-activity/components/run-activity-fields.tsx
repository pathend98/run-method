import { RunFieldFormInput } from "@/ui/run-field-input/run-field-form-input";

type RunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function RunActivityFields({ onPendingChange }: RunActivityFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
