import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SkipActivityForm } from "./skip-activity-form";

const skipReasonLabelText = "Why are you skipping this activity?";

test("validates and submits a skip reason", async () => {
  const onSkip = vi.fn().mockResolvedValue(undefined);
  render(<SkipActivityForm isSubmitting={false} onSkip={onSkip} />);

  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
  fireEvent.change(screen.getByLabelText(skipReasonLabelText), {
    target: { value: "  Recovery  " },
  });
  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  await waitFor(() =>
    expect(onSkip).toHaveBeenCalledWith({ skipReason: "Recovery" }),
  );
});

test("disables the skip field while submitting", () => {
  render(<SkipActivityForm isSubmitting onSkip={vi.fn()} />);
  expect(screen.getByLabelText(skipReasonLabelText)).toHaveProperty("disabled", true);
});

test("reports submission failures", async () => {
  render(
    <SkipActivityForm
      isSubmitting={false}
      onSkip={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );

  fireEvent.change(screen.getByLabelText(skipReasonLabelText), {
    target: { value: "Recovery" },
  });
  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to skip activity",
  );
});
