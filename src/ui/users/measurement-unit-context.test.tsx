import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";

import {
  DistanceDisplayProvider,
  useDistanceDisplayUnit,
} from "./measurement-unit-context";

test("defaults standalone displays to kilometres", () => {
  expect(renderHook(() => useDistanceDisplayUnit()).result.current).toBe(
    "KILOMETRES",
  );
});

test("provides the selected unit to nested displays", () => {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <DistanceDisplayProvider measurementUnit="MILES">
        {children}
      </DistanceDisplayProvider>
    );
  }

  expect(
    renderHook(() => useDistanceDisplayUnit(), { wrapper: Wrapper }).result
      .current,
  ).toBe("MILES");
});
