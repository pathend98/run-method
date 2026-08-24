import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { QueryProvider } from "./query-provider";

function QueryClientProbe() {
  const queryClient = useQueryClient();
  const retry = queryClient.getDefaultOptions().queries?.retry;

  return <p>Retry: {String(retry)}</p>;
}

test("QueryProvider renders children with a React Query client", () => {
  render(
    <QueryProvider>
      <QueryClientProbe />
      <p>Planner child</p>
    </QueryProvider>,
  );

  expect(screen.getByText("Planner child")).toBeDefined();
  expect(screen.getByText("Retry: false")).toBeDefined();
});
