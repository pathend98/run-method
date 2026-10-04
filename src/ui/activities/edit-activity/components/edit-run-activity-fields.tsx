import { RunFieldFormInput } from "@/ui/activities/run-field-form-input/run-field-form-input";

type EditRunActivityFieldsProps = {
  onPendingChange: (pending: boolean) => void;
};

export function EditRunActivityFields({
  onPendingChange,
}: EditRunActivityFieldsProps) {
  return <RunFieldFormInput onPendingChange={onPendingChange} />;
}
