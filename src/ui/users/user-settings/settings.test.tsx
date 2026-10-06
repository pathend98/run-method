import { fireEvent, render, screen } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { User } from "@/domain/user-types";
import { createUser } from "@/test-support/fixtures/user";
import { Settings } from "./settings";

const registered = createUser({
  firstName: "Ada",
});

function renderSettings(user: User = registered) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(user),
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryProvider>
      <Settings />
    </QueryProvider>,
  );
  return fetchMock;
}

test("shows the registered profile and read-only account details", async () => {
  renderSettings();

  expect(
    await screen.findByRole("heading", { name: "Settings" }),
  ).toBeDefined();
  expect(screen.getByLabelText("First name")).toHaveProperty("value", "Ada");
  expect(screen.getByText("user-id")).toBeDefined();
  expect(screen.getByText("Registered")).toBeDefined();
});

test("guests see a registration prompt and cannot edit settings", async () => {
  renderSettings(createUser({ kind: "GUEST", firstName: null }));

  expect(await screen.findByText(/need to register/i)).toBeDefined();
  expect(
    screen.getByRole("link", { name: "Register" }).getAttribute("href"),
  ).toBe("/auth");
  expect(screen.queryByLabelText("First name")).toBeNull();
});

test("retries after the current user fails to load", async () => {
  let requests = 0;
  const fetchMock = vi.fn().mockImplementation(() => {
    requests += 1;
    return Promise.resolve({
      ok: requests > 1,
      status: requests > 1 ? 200 : 500,
      json: vi
        .fn()
        .mockResolvedValue(
          requests > 1 ? registered : { error: "Unavailable" },
        ),
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryProvider>
      <Settings />
    </QueryProvider>,
  );

  expect(screen.getByText("Loading settings...")).toBeDefined();
  fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
  expect(await screen.findByLabelText("First name")).toHaveProperty(
    "value",
    "Ada",
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
