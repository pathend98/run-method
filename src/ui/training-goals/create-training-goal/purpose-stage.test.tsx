import { render, renderHook, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";
import { PurposeStage } from "./purpose-stage";

test("renders the stage fields using the shared form state", () => {
  const { result } = renderHook(() => useForm<CreateTrainingGoalRequest>());
  render(
    <FormProvider {...result.current}>
      <PurposeStage />
    </FormProvider>,
  );
  expect(
    screen.getByLabelText(
      "What do you want this period of training to help you develop?",
    ),
  ).toBeDefined();
});
