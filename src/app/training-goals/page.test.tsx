import { render, screen, within } from "@testing-library/react";
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

test("renders active goal details inside the main landmark", async () => {
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
  expect(
    await within(screen.getByRole("main")).findByRole("heading", {
      name: "Run a marathon",
    }),
  ).toBeDefined();
  expect(
    screen.queryByRole("button", { name: "Create training goal" }),
  ).toBeNull();
});
