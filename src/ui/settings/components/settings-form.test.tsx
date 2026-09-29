import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { User } from "@/domain/user-types";
import { createUser } from "@/test-support/fixtures/user";
import { SettingsForm } from "./settings-form";

const registered = createUser({
  firstName: "Ada",
});

function renderForm(user: User = registered) {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryProvider>
      <SettingsForm user={user} />
    </QueryProvider>,
  );
  return fetchMock;
}

test("initializes from the user and does not submit unchanged values", async () => {
  const fetchMock = renderForm();

  expect(screen.getByLabelText("First name")).toHaveProperty("value", "Ada");
  expect(screen.getByLabelText("Measurement unit")).toHaveProperty(
    "value",
    "KILOMETRES",
  );
  const save = screen.getByRole("button", { name: "Save changes" });
  expect(save).toHaveProperty("disabled", true);
  fireEvent.submit(save.closest("form")!);
  await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
});

test("initializes a missing first name as blank", () => {
  renderForm(createUser({ firstName: null }));
  expect(screen.getByLabelText("First name")).toHaveProperty("value", "");
});

test("saves trimmed values, updates the form, and clears its changed state", async () => {
  const fetchMock = renderForm();
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "  Grace  " },
  });
  fireEvent.change(screen.getByLabelText("Measurement unit"), {
    target: { value: "MILES" },
  });
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValue(
      createUser({
        firstName: "Grace",
        measurementUnit: "MILES",
      }),
    ),
  });

  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Settings saved.",
  );
  expect(fetchMock).toHaveBeenCalledWith("/api/v1/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: '{"firstName":"Grace","measurementUnit":"MILES"}',
    cache: "no-store",
  });
  expect(screen.getByLabelText("First name")).toHaveProperty("value", "Grace");
  expect(screen.getByLabelText("Measurement unit")).toHaveProperty(
    "value",
    "MILES",
  );
  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Gracie" },
  });
  expect(screen.queryByRole("status")).toBeNull();
});

test("clears a saved name by sending null", async () => {
  const fetchMock = renderForm();
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "" },
  });
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValue(createUser({ firstName: null })),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await screen.findByRole("status");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/me",
    expect.objectContaining({
      body: '{"firstName":null,"measurementUnit":"KILOMETRES"}',
    }),
  );
  expect(screen.getByLabelText("First name")).toHaveProperty("value", "");
});

test("keeps edits after a failed save and clears the error on the next edit", async () => {
  const fetchMock = renderForm();
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Grace" },
  });
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: vi.fn().mockResolvedValue({ error: "Server error" }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to save settings. Please try again.",
  );
  expect(screen.getByLabelText("First name")).toHaveProperty("value", "Grace");
  fireEvent.change(screen.getByLabelText("Measurement unit"), {
    target: { value: "MILES" },
  });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    false,
  );
});
