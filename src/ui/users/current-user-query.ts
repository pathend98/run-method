"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "./user-api-client";

export function useCurrentUserQuery(enabled = true) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    enabled,
  });
}
