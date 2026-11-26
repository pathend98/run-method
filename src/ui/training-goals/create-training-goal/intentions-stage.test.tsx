import { render, renderHook, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { IntentionsStage } from "./intentions-stage";

test("renders the stage fields using the shared form state", () => {
  const { result } = renderHook(() => useForm<CreateTrainingGoalRequest>());
  render(
    <FormProvider {...result.current}>
      <IntentionsStage />
    </FormProvider>,
  );
  expect(
    screen.getByLabelText("How will you approach your training?"),
  ).toBeDefined();
});
