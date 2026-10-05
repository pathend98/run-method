import { renderHook, waitFor } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import { QueryProvider } from "@/app/query-provider";
import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fetchTrainingSessions } from "@/ui/training-sessions/api/training-sessions-api-client";
import { useReviewTrainingSessionsQuery } from "./use-review-training-sessions-query";

vi.mock("@/ui/training-sessions/api/training-sessions-api-client", () => ({
  fetchTrainingSessions: vi.fn(),
}));

const trainingSessions = [createRunTrainingSession()];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchTrainingSessions).mockResolvedValue(trainingSessions);
});

test("fetches past scheduled training sessions and preserves their cache key", async () => {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const { result } = renderHook(
    () => ({
      query: useReviewTrainingSessionsQuery("athlete-id", true),
      client: useQueryClient(),
    }),
    { wrapper: QueryProvider },
  );

  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  expect(result.current.query.data).toEqual(trainingSessions);
  expect(fetchTrainingSessions).toHaveBeenCalledExactlyOnceWith("athlete-id", {
    status: "SCHEDULED",
    to: yesterday,
  });
  expect(
    result.current.client.getQueryData([
      "training-sessions",
      "athlete-id",
      "past-scheduled",
      yesterday,
    ]),
  ).toEqual(trainingSessions);
});

test("waits until review is enabled", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useReviewTrainingSessionsQuery("athlete-id", enabled),
    { wrapper: QueryProvider, initialProps: { enabled: false } },
  );
  expect(result.current.fetchStatus).toBe("idle");
  expect(fetchTrainingSessions).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(fetchTrainingSessions).toHaveBeenCalledTimes(1);
});

test("waits until an athlete is available and isolates athlete caches", async () => {
  const initialProps: { athleteId: string | undefined } = {
    athleteId: undefined,
  };
  const { result, rerender } = renderHook(
    ({ athleteId }: { athleteId: string | undefined }) => ({
      query: useReviewTrainingSessionsQuery(athleteId, true),
      client: useQueryClient(),
    }),
    { wrapper: QueryProvider, initialProps },
  );
  expect(result.current.query.fetchStatus).toBe("idle");
  expect(fetchTrainingSessions).not.toHaveBeenCalled();
  rerender({ athleteId: "first-athlete" });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  const otherTrainingSessions = [
    createRunTrainingSession({ title: "Another run" }),
  ];
  vi.mocked(fetchTrainingSessions).mockResolvedValue(otherTrainingSessions);
  rerender({ athleteId: "second-athlete" });
  await waitFor(() =>
    expect(result.current.query.data).toEqual(otherTrainingSessions),
  );
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  expect(
    result.current.client.getQueryData([
      "training-sessions",
      "first-athlete",
      "past-scheduled",
      yesterday,
    ]),
  ).toEqual(trainingSessions);
  expect(fetchTrainingSessions).toHaveBeenCalledTimes(2);
});

test("exposes service errors without retrying", async () => {
  const error = new Error("Unable to load training sessions");
  vi.mocked(fetchTrainingSessions).mockRejectedValue(error);
  const { result } = renderHook(
    () => useReviewTrainingSessionsQuery("athlete-id", true),
    {
      wrapper: QueryProvider,
    },
  );
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error).toBe(error);
  expect(fetchTrainingSessions).toHaveBeenCalledTimes(1);
});
