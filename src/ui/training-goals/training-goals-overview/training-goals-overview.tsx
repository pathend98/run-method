"use client";

import { format } from "date-fns";
import { isTrainingGoalActive } from "@/domain/training-goals";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { Button } from "@/ui/shared/button/button";
import { CreateTrainingGoal } from "../create-training-goal";
import { TrainingGoalDetails } from "./training-goal-details";
import {
  createTrainingGoal,
  fetchTrainingGoals,
} from "../api/training-goals-api-client";

export function TrainingGoalsOverview() {
  const currentUser = useCurrentUserQuery();
  const athleteId = currentUser.data?.id;
  const queryClient = useQueryClient();
  const queryKey = ["training-goals", athleteId];
  const goals = useQuery({
    queryKey,
    queryFn: athleteId ? () => fetchTrainingGoals(athleteId) : skipToken,
  });

  if (currentUser.isError || goals.isError) {
    return (
      <section className="px-4 py-8">
        <p role="alert">Unable to load training goals.</p>
        <Button
          onClick={() =>
            void (currentUser.isError ? currentUser.refetch() : goals.refetch())
          }
        >
          Retry
        </Button>
      </section>
    );
  }
  if (currentUser.isPending || goals.isPending) {
    return (
      <p role="status" className="px-4 py-8">
        Loading training goals...
      </p>
    );
  }
  const today = format(new Date(), "yyyy-MM-dd");
  const activeGoal = goals.data.find((goal) =>
    isTrainingGoalActive(goal, today),
  );
  const user = currentUser.data;
  const currentGoals = goals.data;

  async function submit(request: CreateTrainingGoalRequest) {
    const goal = await createTrainingGoal(user.id, request);
    queryClient.setQueryData<TrainingGoal[]>(queryKey, [...currentGoals, goal]);
    await queryClient.invalidateQueries({ queryKey });
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-zinc-950 sm:text-4xl">
        Training goals
      </h1>
      {activeGoal ? (
        <TrainingGoalDetails goal={activeGoal} />
      ) : (
        <CreateTrainingGoal
          key={athleteId}
          showIntroduction={goals.data.length === 0}
          onSubmit={submit}
        />
      )}
    </section>
  );
}
