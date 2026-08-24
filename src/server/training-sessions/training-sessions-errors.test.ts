import { BadRequestError } from "@/server/server-errors";
import {
  TrainingSessionsDataIntegrityError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";

test("TrainingSessionsValidationError extends BadRequestError with its own name", () => {
  const error = new TrainingSessionsValidationError("Invalid training session");

  expect(error).toBeInstanceOf(BadRequestError);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Invalid training session");
  expect(error.name).toBe("TrainingSessionsValidationError");
});

test("TrainingSessionsDataIntegrityError exposes its message and error name", () => {
  const error = new TrainingSessionsDataIntegrityError("Unexpected row shape");

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Unexpected row shape");
  expect(error.name).toBe("TrainingSessionsDataIntegrityError");
});
