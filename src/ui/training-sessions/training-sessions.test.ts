import { fetchTrainingSessions } from "./training-sessions";

test("training sessions module exposes its public interface", () => {
  expect(fetchTrainingSessions).toBeTypeOf("function");
});
