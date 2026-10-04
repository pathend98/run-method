import { RunFieldFormInput } from "@/ui/run-field-input/run-field-form-input";

type EditRunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function EditRunActivityFields({
  onPendingChange,
}: EditRunActivityFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
