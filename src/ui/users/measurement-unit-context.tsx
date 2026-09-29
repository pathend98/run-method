"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { User } from "@/domain/user-types";

const DistanceDisplayUnitContext =
  createContext<User["measurementUnit"]>("KILOMETRES");

type DistanceDisplayProviderProps = {
  children: ReactNode;
  measurementUnit: User["measurementUnit"];
};

export function DistanceDisplayProvider({
  children,
  measurementUnit,
}: DistanceDisplayProviderProps) {
  return (
    <DistanceDisplayUnitContext.Provider value={measurementUnit}>
      {children}
    </DistanceDisplayUnitContext.Provider>
  );
}

export function useDistanceDisplayUnit() {
  return useContext(DistanceDisplayUnitContext);
}
