import { render, screen } from "@testing-library/react";
import TrainingPlannerPage from "./page";

const navigation = vi.hoisted(() => ({ suspend: false }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/training-planner",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => {
    if (navigation.suspend) {
      throw new Promise(() => undefined);
    }

    return new URLSearchParams();
  },
}));

beforeEach(() => {
  navigation.suspend = false;
});

test("TrainingPlannerPage", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => undefined)),
  );

  render(<TrainingPlannerPage />);

  expect(screen.getByRole("main")).toBeDefined();
  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Training Plan",
  });
  expect(heading.classList).not.toContain("text-center");
  expect(heading.classList).toContain("text-2xl");
  expect(heading.classList).toContain("sm:text-4xl");
  expect(screen.getByText("Loading training planner...")).toBeDefined();
});

test("TrainingPlannerPage renders its planner fallback while URL parameters resolve", () => {
  navigation.suspend = true;

  render(<TrainingPlannerPage />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Training Plan" }),
  ).toBeDefined();
  expect(screen.getByText("Loading training planner...")).toBeDefined();
});
