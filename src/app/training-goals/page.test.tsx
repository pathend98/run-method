import { render, screen, within, waitFor } from "@testing-library/react";
import { QueryProvider } from "@/app/query-provider";
import { createUser } from "@/test-support/fixtures/user";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import TrainingGoalsPage from "./page";

afterEach(() => vi.unstubAllGlobals());

test("renders training goals inside the main landmark", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(createUser())))
      .mockResolvedValueOnce(new Response("[]")),
  );
  render(
    <QueryProvider>
      <TrainingGoalsPage />
    </QueryProvider>,
  );
  expect(
    await within(screen.getByRole("main")).findByRole("heading", {
      level: 1,
      name: "Training goals",
    }),
  ).toBeDefined();
});

test("keeps the main landmark empty when there is an active goal", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(createUser())))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([createTrainingGoal()])),
      ),
  );
  render(
    <QueryProvider>
      <TrainingGoalsPage />
    </QueryProvider>,
  );
  await waitFor(() => expect(screen.getByRole("main").innerHTML).toBe(""));
});
