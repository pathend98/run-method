import { toSkipTrainingSessionRequest } from "./skip-training-session-form";

test("converts a skip form value to an API request", () => {
  expect(toSkipTrainingSessionRequest({ skipReason: "  Travel  " })).toEqual({
    skipReason: "Travel",
  });
});
