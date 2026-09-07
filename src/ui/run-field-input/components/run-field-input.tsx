import { FormField } from "@/ui/components/form-field";
import { Button } from "@/ui/components/button";
import { useRunFieldInputController } from "../hooks/use-run-field-input-controller";
import {
  metricLabel,
  type RunFieldInputValue,
  type RunFieldMetric,
} from "../utils/run-field-calculations";
import { RunDurationField } from "./run-duration-field";

export type RunFieldInputErrors = Partial<
  Record<RunFieldMetric, string | undefined>
>;

type RunFieldInputProps = {
  disabled?: boolean;
  errors?: RunFieldInputErrors;
  onChange: (value: RunFieldInputValue) => void;
  onMetricBlur?: (metric: RunFieldMetric) => void;
  onPendingChange?: (pending: boolean) => void;
  value: RunFieldInputValue;
};

function doNothing() {}

export function RunFieldInput({
  disabled = false,
  errors = {},
  onChange,
  onMetricBlur = doNothing,
  onPendingChange = doNothing,
  value,
}: RunFieldInputProps) {
  const controller = useRunFieldInputController({
    onChange,
    onPendingChange,
    value,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          error={errors.distance}
          label={fieldLabel(
            "Distance (km)",
            value.derivedMetric === "distance",
          )}
        >
          <input
            disabled={disabled}
            inputMode="decimal"
            onBlur={() => {
              controller.finishAutoEdit("distance");
              onMetricBlur("distance");
            }}
            onChange={(event) =>
              controller.changeMetric("distance", {
                ...value,
                distanceKilometres: event.target.value,
              })
            }
            onFocus={() => controller.beginAutoEdit("distance")}
            placeholder="8"
            value={value.distanceKilometres}
          />
        </FormField>

        <RunDurationField
          auto={value.derivedMetric === "duration"}
          disabled={disabled}
          error={errors.duration}
          onAutoEditEnd={() => {
            controller.finishAutoEdit("duration");
            onMetricBlur("duration");
          }}
          onAutoEditStart={() => controller.beginAutoEdit("duration")}
          onChange={(next) => controller.changeMetric("duration", next)}
          value={value}
        />

        <FormField
          error={errors.pace}
          label={fieldLabel(
            "Pace (mm:ss / km)",
            value.derivedMetric === "pace",
          )}
        >
          <input
            disabled={disabled}
            onBlur={() => {
              controller.finishAutoEdit("pace");
              onMetricBlur("pace");
            }}
            onChange={(event) =>
              controller.changeMetric("pace", {
                ...value,
                pacePerKilometre: event.target.value,
              })
            }
            onFocus={() => controller.beginAutoEdit("pace")}
            placeholder="5:30"
            value={value.pacePerKilometre}
          />
        </FormField>
      </div>

      {controller.pendingMetric ? (
        <div
          aria-label={`Choose a fixed value after changing ${metricLabel(controller.pendingMetric)}`}
          className="rounded-md border border-teal-200 bg-teal-50 p-3"
          role="group"
        >
          <p className="text-sm font-medium text-zinc-800">
            Which value should remain fixed?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {controller.authoritativeMetrics.map((metric) => (
              <Button
                disabled={disabled}
                key={metric}
                onClick={() => controller.keepMetric(metric)}
                size="compact"
                type="button"
                variant="secondary"
              >
                Keep {metricLabel(metric)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fieldLabel(label: string, auto: boolean) {
  return auto ? `${label} · Auto` : label;
}
