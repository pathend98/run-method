import { useEffect, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { Button } from "@/ui/shared/button/button";
import {
  trainingGoalFormSchema,
  defaultTrainingGoalFormValues,
} from "./form/training-goal-form";
import { TrainingGoalIntroduction } from "./training-goal-introduction";
import { PurposeStage } from "./purpose-stage";
import { IntentionsStage } from "./intentions-stage";
import { PeriodStage } from "./period-stage";

export type CreateTrainingGoalProps = {
  showIntroduction: boolean;
  onSubmit: (request: CreateTrainingGoalRequest) => Promise<void>;
};

const stageTitles = [
  "Training purpose",
  "Training intentions",
  "Training period",
];

export function CreateTrainingGoal({
  showIntroduction,
  onSubmit,
}: CreateTrainingGoalProps) {
  const [stage, setStage] = useState(showIntroduction ? -1 : 0);
  const heading = useRef<HTMLHeadingElement>(null);
  const saving = useRef(false);
  const form = useForm<CreateTrainingGoalRequest>({
    defaultValues: defaultTrainingGoalFormValues,
    resolver: zodResolver(trainingGoalFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });
  const {
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    heading.current?.focus();
  }, [stage]);

  async function submit(values: CreateTrainingGoalRequest) {
    try {
      await onSubmit(values);
    } catch {
      setError("root", {
        message: "Unable to create training goal. Please try again.",
      });
    }
  }

  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    try {
      if (stage < 2) {
        const valid = await trigger(
          stage === 0 ? "purpose" : "trainingIntentions",
          { shouldFocus: true },
        );
        if (valid) setStage(stage + 1);
      } else {
        await handleSubmit(submit)(event);
      }
    } finally {
      saving.current = false;
    }
  }

  if (stage === -1) {
    return <TrainingGoalIntroduction onStart={() => setStage(0)} />;
  }

  return (
    <FormProvider {...form}>
      <form className="max-w-xl space-y-6" noValidate onSubmit={advance}>
        <div className="space-y-2">
          <p role="status" className="text-sm text-zinc-500">
            Step {stage + 1} of 3
          </p>
          <h2
            ref={heading}
            tabIndex={-1}
            className="text-xl font-semibold text-zinc-950"
          >
            {stageTitles[stage]}
          </h2>
        </div>
        {errors.root ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        ) : null}
        <fieldset className="space-y-6" disabled={isSubmitting}>
          {stage === 0 ? (
            <PurposeStage />
          ) : stage === 1 ? (
            <IntentionsStage />
          ) : (
            <PeriodStage />
          )}
          <div className="flex gap-3">
            {stage > 0 ? (
              <Button onClick={() => setStage(stage - 1)}>Back</Button>
            ) : null}
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {stage < 2
                ? "Continue"
                : isSubmitting
                  ? "Creating…"
                  : "Create training goal"}
            </Button>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}
