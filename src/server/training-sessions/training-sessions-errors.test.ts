import { BadRequestError } from "@/server/errors/bad-request-error";
import {
  TrainingSessionsDataIntegrityError,
  TrainingSessionsRequestValidationError,
  TrainingSessionsValidationError,
  TrainingSessionNotFoundError,
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

test("TrainingSessionsRequestValidationError exposes field errors", () => {
  const fieldErrors = { title: ["Required"] };
  const error = new TrainingSessionsRequestValidationError(fieldErrors);

  expect(error).toBeInstanceOf(BadRequestError);
  expect(error.name).toBe("TrainingSessionsRequestValidationError");
  expect(error.message).toBe("Invalid request body");
  expect(error.fieldErrors).toBe(fieldErrors);
});

test("TrainingSessionNotFoundError exposes a stable message", () => {
  const error = new TrainingSessionNotFoundError();

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("TrainingSessionNotFoundError");
  expect(error.message).toBe("Training session not found");
});
