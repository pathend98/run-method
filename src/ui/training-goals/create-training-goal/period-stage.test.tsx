import { render, renderHook, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { PeriodStage } from "./period-stage";

test("renders the stage fields using the shared form state", () => {
  const { result } = renderHook(() => useForm<CreateTrainingGoalRequest>());
  render(
    <FormProvider {...result.current}>
      <PeriodStage />
    </FormProvider>,
  );
  expect(screen.getByLabelText("Goal name")).toBeDefined();
});
