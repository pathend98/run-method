import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  useCompleteTrainingSessionMutation,
  useCreateTrainingSessionMutation,
  useDeleteTrainingSessionMutation,
  useEditTrainingSessionMutation,
  useSkipTrainingSessionMutation,
} from "./training-session-mutations";

const api = vi.hoisted(() => ({
  completeTrainingSession: vi.fn(),
  createTrainingSession: vi.fn(),
  deleteTrainingSession: vi.fn(),
  editTrainingSession: vi.fn(),
  skipTrainingSession: vi.fn(),
}));

vi.mock("../api", () => api);

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

async function expectInvalidatedMutation(
  invoke: (queryClient: QueryClient) => Promise<void>,
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["training-sessions", "current-week"], []);

  await invoke(queryClient);

  expect(
    queryClient.getQueryState(["training-sessions", "current-week"])
      ?.isInvalidated,
  ).toBe(true);
}

test("create mutation calls the client and invalidates training sessions", async () => {
  const request = { title: "Easy run" };
  api.createTrainingSession.mockResolvedValue({ id: "created" });

  await expectInvalidatedMutation(async (queryClient) => {
    const { result } = renderHook(() => useCreateTrainingSessionMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(() =>
      result.current.mutateAsync({
        athleteId: "33333333-3333-4333-8333-333333333333",
        request: request as never,
      }),
    );
  });

  expect(api.createTrainingSession).toHaveBeenCalledWith(
    "33333333-3333-4333-8333-333333333333",
    request,
  );
});

test("edit mutation calls the client with its id and request", async () => {
  const request = { title: "Updated run" };
  api.editTrainingSession.mockResolvedValue({ id: "edited" });

  await expectInvalidatedMutation(async (queryClient) => {
    const { result } = renderHook(() => useEditTrainingSessionMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(() =>
      result.current.mutateAsync({ id: "edited", request: request as never }),
    );
  });

  expect(api.editTrainingSession).toHaveBeenCalledWith("edited", request);
});

test("delete mutation calls the client with its id", async () => {
  api.deleteTrainingSession.mockResolvedValue(undefined);

  await expectInvalidatedMutation(async (queryClient) => {
    const { result } = renderHook(() => useDeleteTrainingSessionMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(() => result.current.mutateAsync("deleted"));
  });

  expect(api.deleteTrainingSession).toHaveBeenCalledWith("deleted");
});

test("skip mutation calls the client with its id and request", async () => {
  const request = { skipReason: "Recovery" };
  api.skipTrainingSession.mockResolvedValue({ id: "skipped" });

  await expectInvalidatedMutation(async (queryClient) => {
    const { result } = renderHook(() => useSkipTrainingSessionMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(() => result.current.mutateAsync({ id: "skipped", request }));
  });

  expect(api.skipTrainingSession).toHaveBeenCalledWith("skipped", request);
});

test("complete mutation calls the client with its id and request", async () => {
  const request = { actualDurationSeconds: 1800 };
  api.completeTrainingSession.mockResolvedValue({ id: "completed" });

  await expectInvalidatedMutation(async (queryClient) => {
    const { result } = renderHook(() => useCompleteTrainingSessionMutation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(() => result.current.mutateAsync({ id: "completed", request }));
  });

  expect(api.completeTrainingSession).toHaveBeenCalledWith(
    "completed",
    request,
  );
});
