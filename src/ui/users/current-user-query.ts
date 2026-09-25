"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "./user-api-client";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}
