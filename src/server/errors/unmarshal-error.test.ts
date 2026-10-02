import { UnmarshalError } from "./unmarshal-error";

test("preserves field errors without HTTP-specific behavior", () => {
  const fieldErrors = { "items.0.title": ["Required"] };
  const error = new UnmarshalError(fieldErrors);

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("UnmarshalError");
  expect(error.message).toBe("Invalid input");
  expect(error.fieldErrors).toBe(fieldErrors);
});
