import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { DurationFormInput } from "./duration-form-input";

type FormValues = {
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
};

const schema = z.object({
  durationHours: z.string().min(1, "Bad duration"),
  durationMinutes: z.string(),
  durationSeconds: z.string(),
});

function Harness({ disabled = false }: { disabled?: boolean }) {
  const form = useForm<FormValues>({
    defaultValues: {
      durationHours: "",
      durationMinutes: "00",
      durationSeconds: "00",
    },
    resolver: zodResolver(schema),
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
        <DurationFormInput
          autoFocus
          disabled={disabled}
          label="Duration (hh:mm:ss)"
        />
        <output data-testid="dirty-fields">
          {JSON.stringify(form.formState.dirtyFields)}
        </output>
        <button type="submit">Submit</button>
        <button
          onClick={() =>
            form.setError("durationMinutes", { message: "Bad minutes" })
          }
          type="button"
        >
          Set error
        </button>
      </form>
    </FormProvider>
  );
}

test("binds duration values and dirty state to the current form", () => {
  render(<Harness />);
  const hours = screen.getByLabelText<HTMLInputElement>(
    "Duration (hh:mm:ss) hours",
  );
  expect(document.activeElement).toBe(hours);

  fireEvent.change(hours, { target: { value: "01" } });
  expect(hours).toHaveProperty("value", "01");
  expect(screen.getByTestId("dirty-fields").textContent).toContain(
    '"durationHours":true',
  );
});

test("aggregates errors and revalidates when the duration loses focus", async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Set error" }));
  expect(await screen.findByText("Bad minutes")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByText("Bad duration")).toBeDefined();
  fireEvent.change(screen.getByPlaceholderText("hh"), {
    target: { value: "01" },
  });
  expect(screen.getByText("Bad duration")).toBeDefined();
  fireEvent.blur(screen.getByPlaceholderText("hh"));
  await waitFor(() => expect(screen.queryByText("Bad duration")).toBeNull());
});

test("waits until focus leaves the duration group before validating", async () => {
  render(<Harness />);
  const hours = screen.getByPlaceholderText("hh");
  const seconds = screen.getByLabelText("Duration (hh:mm:ss) seconds");

  fireEvent.change(seconds, { target: { value: "10" } });
  fireEvent.blur(seconds, { relatedTarget: hours });
  expect(screen.queryByText("Bad duration")).toBeNull();

  fireEvent.blur(hours);
  expect(await screen.findByText("Bad duration")).toBeDefined();
});

test("forwards the disabled state", () => {
  render(<Harness disabled />);
  expect(
    screen.getByLabelText<HTMLInputElement>("Duration (minutes)").disabled,
  ).toBe(true);
});
