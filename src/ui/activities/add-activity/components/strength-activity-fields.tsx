import { DurationFormInput } from "@/ui/shared/duration-form-input/duration-form-input";

export function StrengthActivityFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DurationFormInput label="Duration (hh:mm:ss, optional)" />
    </div>
  );
}
