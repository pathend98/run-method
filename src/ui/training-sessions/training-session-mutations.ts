"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CompleteTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  completeTrainingSession,
  createTrainingSession,
  deleteTrainingSession,
  editTrainingSession,
  skipTrainingSession,
} from "./training-sessions-api-client";

const trainingSessionsQueryKey = ["training-sessions"];

type EditTrainingSessionVariables = {
  id: string;
  request: EditTrainingSessionRequest;
};

type TransitionTrainingSessionVariables<TRequest> = {
  id: string;
  request: TRequest;
};

export function useCreateTrainingSessionMutation() {
  return useTrainingSessionMutation<
    TrainingSession,
    CreateTrainingSessionRequest
  >((request) => createTrainingSession(request));
}

export function useEditTrainingSessionMutation() {
  return useTrainingSessionMutation(
    ({ id, request }: EditTrainingSessionVariables) =>
      editTrainingSession(id, request),
  );
}

export function useDeleteTrainingSessionMutation() {
  return useTrainingSessionMutation<void, string>((id) =>
    deleteTrainingSession(id),
  );
}

export function useSkipTrainingSessionMutation() {
  return useTrainingSessionMutation(
    ({
      id,
      request,
    }: TransitionTrainingSessionVariables<SkipTrainingSessionRequest>) =>
      skipTrainingSession(id, request),
  );
}

export function useCompleteTrainingSessionMutation() {
  return useTrainingSessionMutation(
    ({
      id,
      request,
    }: TransitionTrainingSessionVariables<CompleteTrainingSessionRequest>) =>
      completeTrainingSession(id, request),
  );
}

function useTrainingSessionMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trainingSessionsQueryKey,
      });
    },
  });
}
