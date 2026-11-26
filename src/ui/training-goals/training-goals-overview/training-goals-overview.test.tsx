import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createUser } from "@/test-support/fixtures/user";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { TrainingGoalsOverview } from "./index";

const user = createUser({ id: createTrainingGoal().athleteId });
const fetchMock = vi.fn();
function json(body: unknown) {
  return new Response(JSON.stringify(body));
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 25, 12));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderGoals() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <TrainingGoalsOverview />
    </QueryClientProvider>,
  );
  return { ...result, client };
}

test.each([
  { goals: [] },
  { goals: [createTrainingGoal({ startDate: "2026-11-26" })] },
  { goals: [createTrainingGoal({ targetDate: "2026-11-24" })] },
  {
    goals: [
      createTrainingGoal({
        resolution: "completed",
        resolvedAt: "2026-11-24T12:00:00Z",
      }),
      createTrainingGoal({
        resolution: "discarded",
        resolvedAt: "2026-11-24T12:00:00Z",
      }),
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
  if (goals.length === 0) {
    expect(
      screen.getByRole("heading", { name: "Give your training direction" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
  } else {
    expect(screen.queryByRole("button", { name: "Get started" })).toBeNull();
  }
  expect(
    screen.getByRole("heading", { name: "Training purpose" }),
  ).toBeDefined();
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `/api/v1/athletes/${user.id}/training-goals`,
    { cache: "no-store" },
  );
});

test("shows only the active goal details and hides the form", async () => {
  fetchMock.mockResolvedValueOnce(json(user)).mockResolvedValueOnce(
    json([
      createTrainingGoal({
        resolution: "completed",
        resolvedAt: "2026-11-24T12:00:00Z",
        title: "Previous goal",
      }),
      createTrainingGoal({
        resolution: "discarded",
        resolvedAt: "2026-11-24T12:00:00Z",
        title: "Discarded goal",
      }),
      createTrainingGoal(),
    ]),
  );
  renderGoals();
  expect(
    await screen.findByRole("heading", { name: "Run a marathon" }),
  ).toBeDefined();
  expect(screen.queryByText("Previous goal")).toBeNull();
  expect(screen.queryByText("Discarded goal")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Create training goal" }),
  ).toBeNull();
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
  expect(
    await screen.findByRole("button", { name: "Get started" }),
  ).toBeDefined();
});

test.each(["2026-10-02", "2026-11-26"])(
  "creates a goal starting %s and refetches the list",
  async (startDate) => {
    const goal = createTrainingGoal({ athleteId: user.id, startDate });
    let finishRefetch!: (response: Response) => void;
    fetchMock
      .mockResolvedValueOnce(json(user))
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json(goal))
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          finishRefetch = resolve;
        }),
      );
    const { client } = renderGoals();
    fireEvent.click(await screen.findByRole("button", { name: "Get started" }));
    fireEvent.change(
      screen.getByLabelText(
        "What do you want this period of training to help you develop?",
      ),
      { target: { value: goal.purpose } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(
      await screen.findByLabelText("How will you approach your training?"),
      { target: { value: goal.trainingIntentions } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(await screen.findByLabelText("Goal name"), {
      target: { value: "My goal" },
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: goal.startDate },
    });
    fireEvent.change(screen.getByLabelText("Target date"), {
      target: { value: goal.targetDate },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create training goal" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `/api/v1/athletes/${user.id}/training-goals`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "My goal",
          purpose: goal.purpose,
          trainingIntentions: goal.trainingIntentions,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
        }),
      },
    );
    expect(client.getQueryData(["training-goals", user.id])).toEqual([goal]);
    if (startDate <= "2026-11-25") {
      expect(
        await screen.findByRole("heading", { name: goal.title }),
      ).toBeDefined();
      expect(
        screen.queryByRole("button", { name: "Create training goal" }),
      ).toBeNull();
    } else {
      expect(screen.queryByRole("heading", { name: goal.title })).toBeNull();
      expect(screen.getByLabelText("Goal name")).toBeDefined();
    }
    finishRefetch(json([goal]));
    if (startDate > "2026-11-25") {
      expect(
        await screen.findByRole("button", { name: "Create training goal" }),
      ).toBeDefined();
    }
  },
);
