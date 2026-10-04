import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createUser } from "@/test-support/fixtures/user";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { TrainingGoals } from "./training-goals";

const user = createUser({ id: createTrainingGoal().athleteId });
const fetchMock = vi.fn();
function json(body: unknown) {
  return new Response(JSON.stringify(body));
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function renderGoals() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <TrainingGoals />
    </QueryClientProvider>,
  );
  return { ...result, client };
}

test.each([
  { goals: [] },
  {
    goals: [
      createTrainingGoal({ status: "COMPLETED" }),
      createTrainingGoal({ status: "DISCARDED" }),
    ],
  },
])("shows the form when no goal is active", async ({ goals }) => {
  fetchMock
    .mockResolvedValueOnce(json(user))
    .mockResolvedValueOnce(json(goals));
  renderGoals();
  expect(
    await screen.findByRole("heading", { name: "Training goals" }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { name: "Create training goal" }),
  ).toBeDefined();
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `/api/v1/athletes/${user.id}/training-goals`,
    { cache: "no-store" },
  );
});

test("renders nothing if any goal is active", async () => {
  fetchMock
    .mockResolvedValueOnce(json(user))
    .mockResolvedValueOnce(
      json([createTrainingGoal({ status: "COMPLETED" }), createTrainingGoal()]),
    );
  const { container } = renderGoals();
  await waitFor(() => expect(container.innerHTML).toBe(""));
});

test("waits for the current user before fetching goals", () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  renderGoals();
  expect(screen.getByRole("status").textContent).toBe(
    "Loading training goals...",
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("does not show the form before the goals response arrives", async () => {
  fetchMock
    .mockResolvedValueOnce(json(user))
    .mockReturnValueOnce(new Promise(() => {}));
  renderGoals();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("status")).toBeDefined();
  expect(screen.queryByLabelText("Title")).toBeNull();
});

test.each(["user", "goals"])("retries a failed %s request", async (failure) => {
  if (failure === "goals") fetchMock.mockResolvedValueOnce(json(user));
  fetchMock.mockRejectedValueOnce(new Error("Offline"));
  renderGoals();
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to load training goals.",
  );
  if (failure === "user") fetchMock.mockResolvedValueOnce(json(user));
  fetchMock.mockResolvedValueOnce(json([]));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByLabelText("Title")).toBeDefined();
});

test("creates a goal, hides the form immediately and refetches the list", async () => {
  const goal = createTrainingGoal({ athleteId: user.id });
  fetchMock
    .mockResolvedValueOnce(json(user))
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce(json(goal))
    .mockReturnValueOnce(new Promise(() => {}));
  const { client, container } = renderGoals();
  fireEvent.change(await screen.findByLabelText("Title"), {
    target: { value: "My goal" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    `/api/v1/athletes/${user.id}/training-goals`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My goal", type: "RACE" }),
    },
  );
  expect(client.getQueryData(["training-goals", user.id])).toEqual([goal]);
  await waitFor(() => expect(container.innerHTML).toBe(""));
});
