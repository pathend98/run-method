import { TrainingSessionsApiError } from "./training-sessions-errors";

test("TrainingSessionsApiError exposes message and status", () => {
  const error = new TrainingSessionsApiError("Nope", 500);

  expect(error.message).toBe("Nope");
  expect(error.name).toBe("TrainingSessionsApiError");
  expect(error.status).toBe(500);
});
