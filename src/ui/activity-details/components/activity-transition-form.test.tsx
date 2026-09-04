import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ActivityTransitionForm } from "./activity-transition-form";

test("validates and submits a skip reason", async () => {
  const onSkip = vi.fn().mockResolvedValue(undefined);
  render(<ActivityTransitionForm isSubmitting={false} onSkip={onSkip} />);

  fireEvent.submit(screen.getByLabelText("Skip reason").closest("form")!);
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();

  fireEvent.change(screen.getByLabelText("Skip reason"), {
    target: { value: "  Recovery  " },
  });
  fireEvent.submit(screen.getByLabelText("Skip reason").closest("form")!);
  await waitFor(() => expect(onSkip).toHaveBeenCalledWith({ skipReason: "Recovery" }));
});

test("disables the skip field while submitting", () => {
  render(<ActivityTransitionForm isSubmitting onSkip={vi.fn()} />);
  expect(screen.getByLabelText("Skip reason")).toHaveProperty("disabled", true);
});
